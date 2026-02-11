namespace DiscordTestProctor.Domain.Entities;

public class Rank : BaseAuditableEntity<Guid>
{
    public required Guid GuildId { get; set; }
    public Guild Guild { get; set; } = default!;
    
    public required string RankId { get; set; } 
    public required string Name { get; set; }
}
