namespace DiscordTestProctor.Domain.Entities;

public class Answer : BaseAuditableEntity<Guid>
{
    public required string Text { get; set; }
    public required Guid QuestionId { get; set; }
    public required Question Question { get; set; } = default!;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}
