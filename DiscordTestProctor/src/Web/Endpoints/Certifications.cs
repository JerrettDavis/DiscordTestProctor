using DiscordTestProctor.Application.Common.Interfaces;
using DiscordTestProctor.Domain.Constants;
using DiscordTestProctor.Domain.Entities;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace DiscordTestProctor.Web.Endpoints;

public class Certifications : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        var group = app.MapGroup(this)
            .RequireAuthorization();

        group.MapGet("guilds", GetGuilds);
        group.MapGet("guilds/{discordGuildId}/certifications", GetCertifications);
        group.MapGet("certifications/{certificationId:guid}", GetCertification);

        var adminGroup = group.RequireAuthorization(policy => policy.RequireRole(Roles.Administrator));
        adminGroup.MapPut("guilds/{discordGuildId}", UpsertGuild);
        adminGroup.MapGet("guilds/{discordGuildId}/ranks", GetRanks);
        adminGroup.MapPut("guilds/{discordGuildId}/ranks/{discordRoleId}", UpsertRank);
        adminGroup.MapPost("guilds/{discordGuildId}/certifications", CreateCertification);
        adminGroup.MapPost("certifications/{certificationId:guid}/questions", AddQuestion);
    }

    public async Task<Ok<IReadOnlyList<GuildDto>>> GetGuilds(IApplicationDbContext context)
    {
        var guilds = await context.Guilds
            .AsNoTracking()
            .OrderBy(g => g.Name)
            .Select(g => new GuildDto(g.Id, g.GuildId, g.Name))
            .ToListAsync();

        return TypedResults.Ok<IReadOnlyList<GuildDto>>(guilds);
    }

    public async Task<Results<Ok<GuildDto>, BadRequest>> UpsertGuild(
        IApplicationDbContext context,
        string discordGuildId,
        UpsertGuildRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return TypedResults.BadRequest();
        }

        var guild = await context.Guilds
            .FirstOrDefaultAsync(g => g.GuildId == discordGuildId);

        if (guild is null)
        {
            guild = new Guild
            {
                GuildId = discordGuildId,
                Name = request.Name
            };

            context.Guilds.Add(guild);
        }
        else
        {
            guild.Name = request.Name;
        }

        await context.SaveChangesAsync(CancellationToken.None);

        return TypedResults.Ok(new GuildDto(guild.Id, guild.GuildId, guild.Name));
    }

    public async Task<Results<Ok<RankDto>, NotFound, BadRequest>> UpsertRank(
        IApplicationDbContext context,
        string discordGuildId,
        string discordRoleId,
        UpsertRankRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return TypedResults.BadRequest();
        }

        var guild = await context.Guilds
            .FirstOrDefaultAsync(g => g.GuildId == discordGuildId);

        if (guild is null)
        {
            return TypedResults.NotFound();
        }

        var rank = await context.Ranks
            .FirstOrDefaultAsync(r => r.GuildId == guild.Id && r.RankId == discordRoleId);

        if (rank is null)
        {
            rank = new Rank
            {
                GuildId = guild.Id,
                RankId = discordRoleId,
                Name = request.Name
            };

            context.Ranks.Add(rank);
        }
        else
        {
            rank.Name = request.Name;
        }

        await context.SaveChangesAsync(CancellationToken.None);

        return TypedResults.Ok(new RankDto(rank.Id, rank.RankId, rank.Name));
    }

    public async Task<Results<Ok<IReadOnlyList<CertificationSummaryDto>>, NotFound>> GetCertifications(
        IApplicationDbContext context,
        string discordGuildId)
    {
        var guild = await context.Guilds
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.GuildId == discordGuildId);

        if (guild is null)
        {
            return TypedResults.NotFound();
        }

        var certifications = await context.Certifications
            .AsNoTracking()
            .Where(c => c.GuildId == guild.Id)
            .OrderBy(c => c.Name)
            .Select(c => new CertificationSummaryDto(
                c.Id,
                c.Name,
                c.Description,
                c.PassingScorePercent,
                c.RankId,
                c.IsTemplate))
            .ToListAsync();

        return TypedResults.Ok<IReadOnlyList<CertificationSummaryDto>>(certifications);
    }

    public async Task<Results<Ok<IReadOnlyList<RankDto>>, NotFound>> GetRanks(
        IApplicationDbContext context,
        string discordGuildId)
    {
        var guild = await context.Guilds
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.GuildId == discordGuildId);

        if (guild is null)
        {
            return TypedResults.NotFound();
        }

        var ranks = await context.Ranks
            .AsNoTracking()
            .Where(r => r.GuildId == guild.Id)
            .OrderBy(r => r.Name)
            .Select(r => new RankDto(r.Id, r.RankId, r.Name))
            .ToListAsync();

        return TypedResults.Ok<IReadOnlyList<RankDto>>(ranks);
    }

    public async Task<Results<Created<CertificationSummaryDto>, NotFound, BadRequest, Conflict>>
        CreateCertification(
            IApplicationDbContext context,
            string discordGuildId,
            CreateCertificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Description) ||
            string.IsNullOrWhiteSpace(request.DiscordRoleId) ||
            request.PassingScorePercent is < 1 or > 100)
        {
            return TypedResults.BadRequest();
        }

        var guild = await context.Guilds
            .FirstOrDefaultAsync(g => g.GuildId == discordGuildId);

        if (guild is null)
        {
            if (string.IsNullOrWhiteSpace(request.GuildName))
            {
                return TypedResults.BadRequest();
            }

            guild = new Guild
            {
                GuildId = discordGuildId,
                Name = request.GuildName
            };

            context.Guilds.Add(guild);
        }

        var rank = await context.Ranks
            .FirstOrDefaultAsync(r => r.GuildId == guild.Id && r.RankId == request.DiscordRoleId);

        if (rank is null)
        {
            if (string.IsNullOrWhiteSpace(request.RankName))
            {
                return TypedResults.BadRequest();
            }

            rank = new Rank
            {
                GuildId = guild.Id,
                RankId = request.DiscordRoleId,
                Name = request.RankName
            };

            context.Ranks.Add(rank);
        }
        else if (!string.IsNullOrWhiteSpace(request.RankName))
        {
            rank.Name = request.RankName;
        }

        var exists = await context.Certifications
            .AnyAsync(c => c.GuildId == guild.Id && c.Name == request.Name);

        if (exists)
        {
            return TypedResults.Conflict();
        }

        var certification = new Certification
        {
            GuildId = guild.Id,
            RankId = rank.Id,
            Name = request.Name,
            Description = request.Description,
            PassingScorePercent = request.PassingScorePercent
        };

        context.Certifications.Add(certification);
        await context.SaveChangesAsync(CancellationToken.None);

        var dto = new CertificationSummaryDto(
            certification.Id,
            certification.Name,
            certification.Description,
            certification.PassingScorePercent,
            certification.RankId,
            certification.IsTemplate);

        return TypedResults.Created($"/api/Certifications/certifications/{certification.Id}", dto);
    }

    public async Task<Results<Ok<CertificationDetailDto>, NotFound>> GetCertification(
        IApplicationDbContext context,
        Guid certificationId)
    {
        var certification = await context.Certifications
            .AsNoTracking()
            .Include(c => c.Questions)
            .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(c => c.Id == certificationId);

        if (certification is null)
        {
            return TypedResults.NotFound();
        }

        var dto = new CertificationDetailDto(
            certification.Id,
            certification.Name,
            certification.Description,
            certification.PassingScorePercent,
            certification.RankId,
            certification.IsTemplate,
            certification.Questions
                .OrderBy(q => q.Created)
                .Select(q => new QuestionDto(
                    q.Id,
                    q.Text,
                    q.Answers
                        .OrderBy(a => a.Order)
                        .Select(a => new AnswerDto(
                            a.Id,
                            a.Text,
                            a.IsCorrect,
                            a.Order))
                        .ToList()))
                .ToList());

        return TypedResults.Ok(dto);
    }

    public async Task<Results<Created<QuestionDto>, NotFound, BadRequest>> AddQuestion(
        IApplicationDbContext context,
        Guid certificationId,
        CreateQuestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text) ||
            request.Answers is null ||
            request.Answers.Count < 2 ||
            request.Answers.Count > 5 ||
            request.Answers.Any(a => string.IsNullOrWhiteSpace(a.Text)) ||
            request.Answers.Count(a => a.IsCorrect) != 1)
        {
            return TypedResults.BadRequest();
        }

        var certification = await context.Certifications
            .FirstOrDefaultAsync(c => c.Id == certificationId);

        if (certification is null)
        {
            return TypedResults.NotFound();
        }

        var question = new Question
        {
            CertificationId = certification.Id,
            Text = request.Text
        };

        var answers = request.Answers
            .Select((answer, index) => new Answer
            {
                Question = question,
                QuestionId = question.Id,
                Text = answer.Text,
                IsCorrect = answer.IsCorrect,
                Order = index + 1
            })
            .ToList();

        question.Answers = answers;

        context.Questions.Add(question);
        await context.SaveChangesAsync(CancellationToken.None);

        var dto = new QuestionDto(
            question.Id,
            question.Text,
            answers.Select(a => new AnswerDto(a.Id, a.Text, a.IsCorrect, a.Order)).ToList());

        return TypedResults.Created($"/api/Certifications/certifications/{certificationId}", dto);
    }

    public record GuildDto(Guid Id, string DiscordGuildId, string Name);

    public record RankDto(Guid Id, string DiscordRoleId, string Name);

    public record CertificationSummaryDto(
        Guid Id,
        string Name,
        string Description,
        int PassingScorePercent,
        Guid RankId,
        bool IsTemplate);

    public record CertificationDetailDto(
        Guid Id,
        string Name,
        string Description,
        int PassingScorePercent,
        Guid RankId,
        bool IsTemplate,
        IReadOnlyList<QuestionDto> Questions);

    public record QuestionDto(Guid Id, string Text, IReadOnlyList<AnswerDto> Answers);

    public record AnswerDto(Guid Id, string Text, bool IsCorrect, int Order);

    public record UpsertGuildRequest(string Name);

    public record UpsertRankRequest(string Name);

    public record CreateCertificationRequest(
        string Name,
        string Description,
        int PassingScorePercent,
        string DiscordRoleId,
        string? RankName,
        string? GuildName);

    public record CreateQuestionRequest(string Text, List<CreateAnswerRequest> Answers);

    public record CreateAnswerRequest(string Text, bool IsCorrect);
}
