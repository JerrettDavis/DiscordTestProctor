using DiscordTestProctor.Application.Common.Interfaces;
using DiscordTestProctor.Domain.Constants;
using DiscordTestProctor.Domain.Enums;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace DiscordTestProctor.Web.Endpoints;

public class Exams : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        var group = app.MapGroup(this)
            .RequireAuthorization(policy => policy.RequireRole(Roles.Administrator));

        group.MapGet("sessions", GetLiveSessions);
        group.MapGet("results", GetResults);
    }

    public async Task<Ok<IReadOnlyList<ExamSessionDto>>> GetLiveSessions(
        IApplicationDbContext context,
        string? discordGuildId = null)
    {
        var now = DateTimeOffset.UtcNow;

        var query = context.ExamSessions
            .AsNoTracking()
            .Include(s => s.Guild)
            .Where(s => s.Status == ExamStatus.Active && s.ExpiresAt >= now);

        if (!string.IsNullOrWhiteSpace(discordGuildId))
        {
            query = query.Where(s => s.Guild.GuildId == discordGuildId);
        }

        var sessions = await query
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new ExamSessionDto(
                s.Id,
                s.Guild.GuildId,
                s.Guild.Name,
                s.CertificationName,
                s.DiscordUserId,
                s.DiscordUserName,
                s.QuestionCount,
                s.CorrectCount,
                s.PassingScorePercent,
                s.ScorePercent,
                s.Passed,
                s.Status,
                s.StartedAt,
                s.LastAnswerAt,
                s.CompletedAt,
                s.ExpiresAt))
            .ToListAsync();

        return TypedResults.Ok<IReadOnlyList<ExamSessionDto>>(sessions);
    }

    public async Task<Ok<IReadOnlyList<ExamSessionDto>>> GetResults(
        IApplicationDbContext context,
        string? discordGuildId = null)
    {
        var now = DateTimeOffset.UtcNow;

        var query = context.ExamSessions
            .AsNoTracking()
            .Include(s => s.Guild)
            .Where(s => s.Status == ExamStatus.Completed ||
                        (s.Status == ExamStatus.Active && s.ExpiresAt < now) ||
                        s.Status == ExamStatus.Expired);

        if (!string.IsNullOrWhiteSpace(discordGuildId))
        {
            query = query.Where(s => s.Guild.GuildId == discordGuildId);
        }

        var sessions = await query
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new ExamSessionDto(
                s.Id,
                s.Guild.GuildId,
                s.Guild.Name,
                s.CertificationName,
                s.DiscordUserId,
                s.DiscordUserName,
                s.QuestionCount,
                s.CorrectCount,
                s.PassingScorePercent,
                s.ScorePercent,
                s.Passed,
                s.Status == ExamStatus.Active && s.ExpiresAt < now ? ExamStatus.Expired : s.Status,
                s.StartedAt,
                s.LastAnswerAt,
                s.CompletedAt ?? (s.ExpiresAt < now ? s.ExpiresAt : null),
                s.ExpiresAt))
            .ToListAsync();

        return TypedResults.Ok<IReadOnlyList<ExamSessionDto>>(sessions);
    }

    public record ExamSessionDto(
        Guid Id,
        string DiscordGuildId,
        string GuildName,
        string CertificationName,
        string DiscordUserId,
        string DiscordUserName,
        int QuestionCount,
        int CorrectCount,
        int PassingScorePercent,
        int? ScorePercent,
        bool? Passed,
        ExamStatus Status,
        DateTimeOffset StartedAt,
        DateTimeOffset? LastAnswerAt,
        DateTimeOffset? CompletedAt,
        DateTimeOffset ExpiresAt);
}
