using DiscordTestProctor.Application.Common.Interfaces;
using DiscordTestProctor.Application.Common.Models;
using DiscordTestProctor.Domain.Entities;
using DiscordTestProctor.Web.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DiscordTestProctor.Web.Services;

public class GuildSyncService(
    IDiscordService discordService,
    IServiceScopeFactory scopeFactory,
    IHubContext<GuildHub> hubContext,
    GuildSyncState syncState,
    IConfiguration configuration,
    ILogger<GuildSyncService> logger) : BackgroundService
{
    private readonly SemaphoreSlim _syncGate = new(1, 1);

    private readonly TimeSpan _interval =
        TimeSpan.FromSeconds(Math.Max(15, configuration.GetValue("Discord:GuildSyncIntervalSeconds", 60)));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        syncState.SetIntervalSeconds((int)_interval.TotalSeconds);
        // Give the bot client a moment to connect before scanning.
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await _syncGate.WaitAsync(stoppingToken);
            try
            {
                await SyncGuildsAsync(stoppingToken);
            }
            finally
            {
                _syncGate.Release();
            }
            await Task.Delay(_interval, stoppingToken);
        }
    }

    public async Task<GuildSyncStatus> RunOnceAsync(CancellationToken cancellationToken)
    {
        await _syncGate.WaitAsync(cancellationToken);
        try
        {
            await SyncGuildsAsync(cancellationToken);
        }
        finally
        {
            _syncGate.Release();
        }

        return syncState.Snapshot();
    }

    private async Task SyncGuildsAsync(CancellationToken cancellationToken)
    {
        var startedAt = DateTimeOffset.UtcNow;
        syncState.MarkRun(startedAt);

        IReadOnlyList<DiscordGuildSnapshot> botGuilds;
        try
        {
            botGuilds = await discordService.GetBotGuildSnapshotsAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch bot guilds.");
            syncState.MarkFailure(ex);
            await hubContext.Clients.All.SendAsync("guilds:status", syncState.Snapshot(), cancellationToken);
            return;
        }

        logger.LogInformation("Guild sync discovered {GuildCount} guild(s).", botGuilds.Count);
        if (botGuilds.Count == 0)
        {
            logger.LogWarning("Guild sync found zero guilds. Check bot invite, token, and gateway intents.");
        }

        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

            var existing = await context.Guilds.ToListAsync(cancellationToken);

            var existingByDiscordId = existing.ToDictionary(g => g.GuildId, StringComparer.OrdinalIgnoreCase);

            var changed = false;
            var createdGuilds = new List<string>();

            foreach (var botGuild in botGuilds)
            {
                if (!existingByDiscordId.TryGetValue(botGuild.GuildId, out var stored))
                {
                    context.Guilds.Add(new Guild
                    {
                        GuildId = botGuild.GuildId,
                        Name = botGuild.Name
                    });
                    changed = true;
                    createdGuilds.Add(botGuild.GuildId);
                    continue;
                }

                if (!string.Equals(stored.Name, botGuild.Name, StringComparison.Ordinal))
                {
                    stored.Name = botGuild.Name;
                    changed = true;
                }
            }

            if (changed)
            {
                await context.SaveChangesAsync(cancellationToken);
            }

            var guildMap = await context.Guilds
                .AsNoTracking()
                .ToDictionaryAsync(g => g.GuildId, StringComparer.OrdinalIgnoreCase, cancellationToken);

            var rankUpdates = await SyncRolesAsync(context, guildMap, botGuilds, cancellationToken);
            var templateUpdates = await EnsureTemplatesAsync(context, guildMap, botGuilds, createdGuilds, cancellationToken);

            if (changed || rankUpdates || templateUpdates)
            {
                var payload = await context.Guilds
                    .AsNoTracking()
                    .OrderBy(g => g.Name)
                    .Select(g => new GuildBroadcastDto(g.Id, g.GuildId, g.Name))
                    .ToListAsync(cancellationToken);

                await hubContext.Clients.All.SendAsync("guilds:updated", payload, cancellationToken);
            }

            var roleCount = await context.Ranks.CountAsync(cancellationToken);
            var templateCount = await context.Certifications.CountAsync(c => c.IsTemplate, cancellationToken);
            var durationMs = (DateTimeOffset.UtcNow - startedAt).TotalMilliseconds;

            syncState.MarkSuccess(
                startedAt,
                guildMap.Count,
                roleCount,
                templateCount,
                durationMs);
            await hubContext.Clients.All.SendAsync("guilds:status", syncState.Snapshot(), cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Guild sync failed.");
            syncState.MarkFailure(ex);
            await hubContext.Clients.All.SendAsync("guilds:status", syncState.Snapshot(), cancellationToken);
        }
    }

    private sealed record GuildBroadcastDto(Guid Id, string DiscordGuildId, string Name);

    private async Task<bool> SyncRolesAsync(
        IApplicationDbContext context,
        IReadOnlyDictionary<string, Guild> guildMap,
        IReadOnlyList<DiscordGuildSnapshot> botGuilds,
        CancellationToken cancellationToken)
    {
        var changed = false;

        foreach (var botGuild in botGuilds)
        {
            if (!guildMap.TryGetValue(botGuild.GuildId, out var storedGuild))
            {
                continue;
            }

            var existingRanks = await context.Ranks
                .Where(r => r.GuildId == storedGuild.Id)
                .ToListAsync(cancellationToken);

            var rankLookup = existingRanks
                .ToDictionary(r => r.RankId, StringComparer.OrdinalIgnoreCase);

            foreach (var role in botGuild.Roles.Where(r => !r.IsEveryone))
            {
                if (!rankLookup.TryGetValue(role.RoleId, out var rank))
                {
                    context.Ranks.Add(new Rank
                    {
                        GuildId = storedGuild.Id,
                        RankId = role.RoleId,
                        Name = role.Name
                    });
                    changed = true;
                    continue;
                }

                if (!string.Equals(rank.Name, role.Name, StringComparison.Ordinal))
                {
                    rank.Name = role.Name;
                    changed = true;
                }
            }

        }

        if (changed)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        return changed;
    }

    private async Task<bool> EnsureTemplatesAsync(
        IApplicationDbContext context,
        IReadOnlyDictionary<string, Guild> guildMap,
        IReadOnlyList<DiscordGuildSnapshot> botGuilds,
        IReadOnlyCollection<string> createdGuilds,
        CancellationToken cancellationToken)
    {
        var changed = false;

        foreach (var botGuild in botGuilds)
        {
            if (!guildMap.TryGetValue(botGuild.GuildId, out var storedGuild))
            {
                continue;
            }

            if (!createdGuilds.Contains(botGuild.GuildId))
            {
                var hasTemplates = await context.Certifications
                    .AnyAsync(c => c.GuildId == storedGuild.Id && c.IsTemplate, cancellationToken);
                if (hasTemplates)
                {
                    continue;
                }
            }

            var placeholderRank = await context.Ranks
                .FirstOrDefaultAsync(r => r.GuildId == storedGuild.Id && r.RankId == "UNASSIGNED", cancellationToken);

            if (placeholderRank is null)
            {
                placeholderRank = new Rank
                {
                    GuildId = storedGuild.Id,
                    RankId = "UNASSIGNED",
                    Name = "Unassigned (template)"
                };
                context.Ranks.Add(placeholderRank);
                changed = true;
                await context.SaveChangesAsync(cancellationToken);
            }

            foreach (var template in TemplateCatalog.BuildTemplates(storedGuild.Id, placeholderRank.Id))
            {
                context.Certifications.Add(template);
                changed = true;
            }
        }

        if (changed)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        return changed;
    }

    private static class TemplateCatalog
    {
        public static IReadOnlyList<Certification> BuildTemplates(Guid guildId, Guid placeholderRankId)
        {
            return new List<Certification>
            {
                BuildTemplate(
                    guildId,
                    placeholderRankId,
                    "US Civics Test",
                    "Foundational civics questions inspired by the USCIS exam.",
                    new[]
                    {
                        Question("What is the supreme law of the land?",
                            Answer("The Constitution", true),
                            Answer("The Declaration of Independence", false),
                            Answer("The Bill of Rights", false),
                            Answer("The Articles of Confederation", false)),
                        Question("How many U.S. Senators are there?",
                            Answer("100", true),
                            Answer("50", false),
                            Answer("435", false),
                            Answer("101", false)),
                        Question("Who is in charge of the executive branch?",
                            Answer("The President", true),
                            Answer("The Chief Justice", false),
                            Answer("The Speaker of the House", false),
                            Answer("The Senate Majority Leader", false)),
                        Question("What do we call the first ten amendments to the Constitution?",
                            Answer("The Bill of Rights", true),
                            Answer("The Preamble", false),
                            Answer("The Federalist Papers", false),
                            Answer("The Articles", false)),
                    }),
                BuildTemplate(
                    guildId,
                    placeholderRankId,
                    "Programming Fundamentals",
                    "Core concepts for junior developers.",
                    new[]
                    {
                        Question("Which data structure uses FIFO ordering?",
                            Answer("Queue", true),
                            Answer("Stack", false),
                            Answer("Tree", false),
                            Answer("Graph", false)),
                        Question("What does HTTP stand for?",
                            Answer("HyperText Transfer Protocol", true),
                            Answer("Hyper Transfer Text Program", false),
                            Answer("High Throughput Transfer Process", false),
                            Answer("Host Transfer Text Protocol", false)),
                        Question("Which keyword creates a constant in JavaScript?",
                            Answer("const", true),
                            Answer("var", false),
                            Answer("let", false),
                            Answer("static", false)),
                        Question("In OOP, bundling data and methods together is called:",
                            Answer("Encapsulation", true),
                            Answer("Inheritance", false),
                            Answer("Polymorphism", false),
                            Answer("Abstraction", false)),
                    }),
                BuildTemplate(
                    guildId,
                    placeholderRankId,
                    "Planets of the Solar System",
                    "A quick quiz about our planetary neighbors.",
                    new[]
                    {
                        Question("Which planet is known as the Red Planet?",
                            Answer("Mars", true),
                            Answer("Venus", false),
                            Answer("Jupiter", false),
                            Answer("Mercury", false)),
                        Question("Which planet is the largest in our solar system?",
                            Answer("Jupiter", true),
                            Answer("Saturn", false),
                            Answer("Earth", false),
                            Answer("Neptune", false)),
                        Question("Which planet has the most prominent ring system?",
                            Answer("Saturn", true),
                            Answer("Uranus", false),
                            Answer("Jupiter", false),
                            Answer("Neptune", false)),
                    }),
                BuildTemplate(
                    guildId,
                    placeholderRankId,
                    "Elements Essentials",
                    "Basic chemistry symbols and properties.",
                    new[]
                    {
                        Question("What is the chemical symbol for Gold?",
                            Answer("Au", true),
                            Answer("Ag", false),
                            Answer("Gd", false),
                            Answer("Go", false)),
                        Question("Which element has atomic number 1?",
                            Answer("Hydrogen", true),
                            Answer("Helium", false),
                            Answer("Oxygen", false),
                            Answer("Carbon", false)),
                        Question("What is the chemical symbol for Sodium?",
                            Answer("Na", true),
                            Answer("So", false),
                            Answer("Sn", false),
                            Answer("Sd", false)),
                        Question("Which element is a noble gas?",
                            Answer("Neon", true),
                            Answer("Nitrogen", false),
                            Answer("Nickel", false),
                            Answer("Neodymium", false)),
                    }),
            };
        }

        private static Certification BuildTemplate(
            Guid guildId,
            Guid rankId,
            string name,
            string description,
            IReadOnlyList<Question> questions)
        {
            var certificationId = Guid.NewGuid();
            var certification = new Certification
            {
                Id = certificationId,
                GuildId = guildId,
                RankId = rankId,
                Name = name,
                Description = description,
                PassingScorePercent = 80,
                IsTemplate = true
            };

            certification.Questions = questions.Select(q =>
            {
                q.CertificationId = certificationId;
                q.Certification = certification;
                foreach (var answer in q.Answers)
                {
                    answer.Question = q;
                    answer.QuestionId = q.Id;
                }
                return q;
            }).ToList();

            return certification;
        }

        private sealed record AnswerSeed(string Text, bool IsCorrect);

        private static Question Question(string text, params AnswerSeed[] answers)
        {
            var question = new Question
            {
                Id = Guid.NewGuid(),
                Text = text
            };

            question.Answers = answers
                .Select((answer, index) => new Answer
                {
                    Id = Guid.NewGuid(),
                    Text = answer.Text,
                    IsCorrect = answer.IsCorrect,
                    Order = index + 1,
                    Question = question,
                    QuestionId = question.Id
                })
                .ToList();
            return question;
        }

        private static AnswerSeed Answer(string text, bool isCorrect)
        {
            return new AnswerSeed(text, isCorrect);
        }
    }
}
