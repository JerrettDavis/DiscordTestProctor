namespace DiscordTestProctor.Domain.Entities;

public class Certification : BaseAuditableEntity<Guid>
{
    public Guid GuildId { get; set; }
    public Guild Guild { get; set; } = default!;
    
    public Guid RankId { get; set; } = default!;
    public Rank Rank { get; set; } = default!;
    
    public required string Name { get; set; }
    public required string Description { get; set; }
    public int PassingScorePercent { get; set; } = 80;
    public bool IsTemplate { get; set; }
    
    public ICollection<Question> Questions { get; set; } = new HashSet<Question>();
}
