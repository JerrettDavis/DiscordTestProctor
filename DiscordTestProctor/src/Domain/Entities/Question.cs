namespace DiscordTestProctor.Domain.Entities;

public class Question : BaseAuditableEntity<Guid>
{
    public Guid CertificationId { get; set; }
    public Certification Certification { get; set; } = default!;

    public required string Text { get; set; }

    public Answer CorrectAnswer => Answers.Single(a => a.IsCorrect);
    public ICollection<Answer> Answers { get; set; } = new HashSet<Answer>();
}
