using Discord;
using Discord.Net;
using Discord.WebSocket;
using DiscordTestProctor.Application.Common.Interfaces;
using DiscordTestProctor.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace DiscordTestProctor.Infrastructure.Discord.Commands;

public class GetCertificates(
    Task<DiscordSocketClient> clientFactory,
    IServiceScopeFactory scopeFactory,
    ILogger<GetCertificates> logger)
{
    private DiscordSocketClient? _client;
    private readonly ConcurrentDictionary<Guid, ExamSession> _sessions = new();
    private static readonly TimeSpan SessionTimeout = TimeSpan.FromMinutes(15);

    public async Task InitializeAsync()
    {
        _client = await clientFactory;

        _client.SlashCommandExecuted += CommandHandler;
        _client.ButtonExecuted += ButtonHandler;
        _client.Log += Log;
        _client.Ready += SetupCommands;
    }

    private async Task SetupCommands()
    {
        var guilds = _client!.Guilds;
        var getCertificates = new SlashCommandBuilder()
            .WithName("get-certificates")
            .WithDescription("Get the certificates available to a user")
            .Build();

        try
        {
            var tasks = guilds.Select(g => g.CreateApplicationCommandAsync(getCertificates));
            await Task.WhenAll(tasks);
        }
        catch (HttpException e)
        {
            logger.LogError(e, "Failed to create global command");
        }
    }

    private Task Log(LogMessage message)
    {
        logger.LogInformation(message.ToString());

        return Task.CompletedTask;
    }

    private async Task CommandHandler(SocketSlashCommand command)
    {
        if (!string.Equals(command.CommandName, "get-certificates", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (command.GuildId is null)
        {
            await command.RespondAsync("This command must be used in a server.", ephemeral: true);
            return;
        }

        CleanupExpiredSessions();

        var discordGuildId = command.GuildId.Value.ToString();

        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var guild = await context.Guilds
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.GuildId == discordGuildId);

        if (guild is null)
        {
            await command.RespondAsync(
                "No certifications are configured for this server yet.",
                ephemeral: true);
            return;
        }

        var certifications = await context.Certifications
            .AsNoTracking()
            .Where(c => c.GuildId == guild.Id)
            .Where(c => !c.IsTemplate)
            .OrderBy(c => c.Name)
            .ToListAsync();

        if (certifications.Count == 0)
        {
            await command.RespondAsync(
                "No certifications are configured for this server yet.",
                ephemeral: true);
            return;
        }

        var builder = new ComponentBuilder();
        var maxButtons = 25;

        foreach (var (certification, index) in certifications.Take(maxButtons).Select((c, i) => (c, i)))
        {
            builder.WithButton(
                label: Truncate(certification.Name, 80),
                customId: $"cert_start:{certification.Id}",
                style: ButtonStyle.Primary,
                row: index / 5);
        }

        var message = "Select a certification to start.";
        if (certifications.Count > maxButtons)
        {
            message += $" Showing first {maxButtons} of {certifications.Count}.";
        }

        await command.RespondAsync(message, components: builder.Build(), ephemeral: true);
    }

    private async Task ButtonHandler(SocketMessageComponent component)
    {
        if (component.Data.CustomId.StartsWith("cert_start:", StringComparison.OrdinalIgnoreCase))
        {
            await StartCertificationAsync(component);
            return;
        }

        if (component.Data.CustomId.StartsWith("cert_answer:", StringComparison.OrdinalIgnoreCase))
        {
            await HandleAnswerAsync(component);
        }
    }

    private async Task StartCertificationAsync(SocketMessageComponent component)
    {
        if (component.GuildId is null)
        {
            await component.RespondAsync("This command must be used in a server.", ephemeral: true);
            return;
        }

        if (!TryParseId(component.Data.CustomId, "cert_start:", out var certificationId))
        {
            await component.RespondAsync("Invalid certification selection.", ephemeral: true);
            return;
        }

        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var certification = await context.Certifications
            .AsNoTracking()
            .Include(c => c.Questions)
            .ThenInclude(q => q.Answers)
            .Include(c => c.Rank)
            .FirstOrDefaultAsync(c => c.Id == certificationId);

        if (certification is null)
        {
            await component.RespondAsync("Certification not found.", ephemeral: true);
            return;
        }

        if (certification.Questions.Count == 0)
        {
            await component.RespondAsync("This certification has no questions yet.", ephemeral: true);
            return;
        }

        var questions = certification.Questions
            .OrderBy(q => q.Created)
            .Select(q => new QuestionSnapshot(
                q.Id,
                q.Text,
                q.Answers
                    .OrderBy(a => a.Order)
                    .Select(a => new AnswerSnapshot(a.Id, a.Text, a.IsCorrect))
                    .ToList()))
            .ToList();

        var session = new ExamSession(
            SessionId: Guid.NewGuid(),
            GuildId: component.GuildId.Value,
            UserId: component.User.Id,
            CertificationId: certification.Id,
            CertificationName: certification.Name,
            PassingScorePercent: certification.PassingScorePercent,
            RankDiscordId: certification.Rank.RankId,
            RankName: certification.Rank.Name,
            Questions: questions,
            CurrentIndex: 0,
            CorrectCount: 0,
            ExpiresAt: DateTimeOffset.UtcNow.Add(SessionTimeout));

        _sessions[session.SessionId] = session;

        var discordUserName = component.User.GlobalName ?? component.User.Username;
        context.ExamSessions.Add(new Domain.Entities.ExamSession
        {
            Id = session.SessionId,
            GuildId = certification.GuildId,
            CertificationId = certification.Id,
            DiscordUserId = component.User.Id.ToString(),
            DiscordUserName = discordUserName,
            CertificationName = certification.Name,
            RoleDiscordId = certification.Rank.RankId,
            RoleName = certification.Rank.Name,
            PassingScorePercent = certification.PassingScorePercent,
            QuestionCount = session.Questions.Count,
            CorrectCount = 0,
            Status = Domain.Enums.ExamStatus.Active,
            StartedAt = DateTimeOffset.UtcNow,
            ExpiresAt = session.ExpiresAt
        });
        await context.SaveChangesAsync(CancellationToken.None);

        await component.UpdateAsync(message =>
        {
            message.Content = BuildQuestionPrompt(session);
            message.Components = BuildAnswerButtons(session.SessionId, session.Questions[session.CurrentIndex]);
        });
    }

    private async Task HandleAnswerAsync(SocketMessageComponent component)
    {
        if (!TryParseAnswer(component.Data.CustomId, out var sessionId, out var answerId))
        {
            await component.RespondAsync("Invalid answer selection.", ephemeral: true);
            return;
        }

        if (!_sessions.TryGetValue(sessionId, out var session))
        {
            await component.RespondAsync("That session has expired. Please start again.", ephemeral: true);
            return;
        }

        if (session.UserId != component.User.Id)
        {
            await component.RespondAsync("That session belongs to someone else.", ephemeral: true);
            return;
        }

        if (session.ExpiresAt < DateTimeOffset.UtcNow)
        {
            _sessions.TryRemove(sessionId, out _);
            await MarkSessionExpiredAsync(sessionId);
            await component.RespondAsync("That session has expired. Please start again.", ephemeral: true);
            return;
        }

        var question = session.Questions[session.CurrentIndex];
        var answer = question.Answers.FirstOrDefault(a => a.AnswerId == answerId);

        if (answer is null)
        {
            await component.RespondAsync("That answer is no longer valid.", ephemeral: true);
            return;
        }

        var correctCount = session.CorrectCount + (answer.IsCorrect ? 1 : 0);
        var nextIndex = session.CurrentIndex + 1;

        if (nextIndex >= session.Questions.Count)
        {
            _sessions.TryRemove(sessionId, out _);
            var scorePercent = (int)Math.Round(correctCount * 100.0 / session.Questions.Count);
            var passed = scorePercent >= session.PassingScorePercent;

            if (passed)
            {
                await TryAssignRoleAsync(component, session);
            }

            await CompleteSessionAsync(sessionId, correctCount, scorePercent, passed);

            var resultMessage =
                $"**{session.CertificationName}** completed!\n" +
                $"Score: {correctCount}/{session.Questions.Count} ({scorePercent}%).\n" +
                (passed
                    ? $"Status: Passed. Role assigned: {session.RankName}."
                    : $"Status: Not passed. Required: {session.PassingScorePercent}%.");

            await component.UpdateAsync(message =>
            {
                message.Content = resultMessage;
                message.Components = new ComponentBuilder().Build();
            });

            return;
        }

        var updatedSession = session with
        {
            CurrentIndex = nextIndex,
            CorrectCount = correctCount,
            ExpiresAt = DateTimeOffset.UtcNow.Add(SessionTimeout)
        };

        _sessions[sessionId] = updatedSession;
        await UpdateSessionProgressAsync(sessionId, correctCount, updatedSession.ExpiresAt);

        await component.UpdateAsync(message =>
        {
            message.Content = BuildQuestionPrompt(updatedSession);
            message.Components = BuildAnswerButtons(updatedSession.SessionId, updatedSession.Questions[updatedSession.CurrentIndex]);
        });
    }

    private async Task UpdateSessionProgressAsync(Guid sessionId, int correctCount, DateTimeOffset expiresAt)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var session = await context.ExamSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session is null)
        {
            return;
        }

        session.CorrectCount = correctCount;
        session.ExpiresAt = expiresAt;
        session.LastAnswerAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(CancellationToken.None);
    }

    private async Task CompleteSessionAsync(Guid sessionId, int correctCount, int scorePercent, bool passed)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var session = await context.ExamSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session is null)
        {
            return;
        }

        session.CorrectCount = correctCount;
        session.ScorePercent = scorePercent;
        session.Passed = passed;
        session.Status = Domain.Enums.ExamStatus.Completed;
        session.CompletedAt = DateTimeOffset.UtcNow;
        session.LastAnswerAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(CancellationToken.None);
    }

    private async Task MarkSessionExpiredAsync(Guid sessionId)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var session = await context.ExamSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session is null)
        {
            return;
        }

        session.Status = Domain.Enums.ExamStatus.Expired;
        session.CompletedAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(CancellationToken.None);
    }

    private async Task TryAssignRoleAsync(SocketMessageComponent component, ExamSession session)
    {
        if (_client is null)
        {
            return;
        }

        if (!ulong.TryParse(session.RankDiscordId, out var roleId))
        {
            logger.LogWarning("Invalid role id configured for certification {CertificationId}", session.CertificationId);
            return;
        }

        var guild = _client.GetGuild(session.GuildId);
        if (guild is null)
        {
            return;
        }

        var user = guild.GetUser(session.UserId);
        if (user is null)
        {
            return;
        }

        try
        {
            await user.AddRoleAsync(roleId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to assign role {RoleId} to user {UserId}", roleId, session.UserId);
            await component.RespondAsync("Passed, but I could not assign the role. Please contact a server admin.", ephemeral: true);
        }
    }

    private static string BuildQuestionPrompt(ExamSession session)
    {
        var question = session.Questions[session.CurrentIndex];
        var letteredAnswers = question.Answers
            .Select((a, i) => $"{ToLetter(i)}) {a.Text}")
            .ToList();

        return $"**{session.CertificationName}**\n" +
               $"Question {session.CurrentIndex + 1}/{session.Questions.Count}\n" +
               $"{question.Text}\n\n" +
               string.Join("\n", letteredAnswers);
    }

    private static MessageComponent BuildAnswerButtons(Guid sessionId, QuestionSnapshot question)
    {
        var builder = new ComponentBuilder();
        for (var index = 0; index < question.Answers.Count; index++)
        {
            var answer = question.Answers[index];
            builder.WithButton(
                label: ToLetter(index).ToString(),
                customId: $"cert_answer:{sessionId}:{answer.AnswerId}",
                style: ButtonStyle.Secondary,
                row: index / 5);
        }

        return builder.Build();
    }

    private static bool TryParseId(string customId, string prefix, out Guid id)
    {
        id = Guid.Empty;
        if (!customId.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var value = customId[prefix.Length..];
        return Guid.TryParse(value, out id);
    }

    private static bool TryParseAnswer(string customId, out Guid sessionId, out Guid answerId)
    {
        sessionId = Guid.Empty;
        answerId = Guid.Empty;

        var parts = customId.Split(':', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 3 || !parts[0].Equals("cert_answer", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return Guid.TryParse(parts[1], out sessionId) && Guid.TryParse(parts[2], out answerId);
    }

    private void CleanupExpiredSessions()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var (id, session) in _sessions)
        {
            if (session.ExpiresAt < now)
            {
                _sessions.TryRemove(id, out _);
            }
        }
    }

    private static char ToLetter(int index) => (char)('A' + index);

    private static string Truncate(string value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        return value.Length <= maxLength ? value : value[..maxLength];
    }

    private sealed record ExamSession(
        Guid SessionId,
        ulong GuildId,
        ulong UserId,
        Guid CertificationId,
        string CertificationName,
        int PassingScorePercent,
        string RankDiscordId,
        string RankName,
        IReadOnlyList<QuestionSnapshot> Questions,
        int CurrentIndex,
        int CorrectCount,
        DateTimeOffset ExpiresAt);

    private sealed record QuestionSnapshot(
        Guid QuestionId,
        string Text,
        IReadOnlyList<AnswerSnapshot> Answers);

    private sealed record AnswerSnapshot(
        Guid AnswerId,
        string Text,
        bool IsCorrect);
}

public class CertificateService(IServiceProvider serviceProvider) :
    BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var getCertificates = serviceProvider.GetRequiredService<GetCertificates>();
        await getCertificates.InitializeAsync();

        while (!stoppingToken.IsCancellationRequested)
        {
            // Wait for a while before checking again
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
