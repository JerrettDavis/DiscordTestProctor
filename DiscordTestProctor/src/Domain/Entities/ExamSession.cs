using DiscordTestProctor.Domain.Enums;

namespace DiscordTestProctor.Domain.Entities;

public class ExamSession : BaseAuditableEntity<Guid>
{
    public required Guid GuildId { get; set; }
    public Guild Guild { get; set; } = default!;

    public required Guid CertificationId { get; set; }
    public Certification Certification { get; set; } = default!;

    public required string DiscordUserId { get; set; }
    public required string DiscordUserName { get; set; }

    public required string CertificationName { get; set; }
    public required string RoleDiscordId { get; set; }
    public required string RoleName { get; set; }

    public int PassingScorePercent { get; set; }
    public int QuestionCount { get; set; }
    public int CorrectCount { get; set; }
    public int? ScorePercent { get; set; }
    public bool? Passed { get; set; }

    public ExamStatus Status { get; set; } = ExamStatus.Active;
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? LastAnswerAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}
