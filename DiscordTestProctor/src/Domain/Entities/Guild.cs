namespace DiscordTestProctor.Domain.Entities;

public class Guild : BaseAuditableEntity<Guid> 
{
   public required string GuildId { get; set; } 
   public required string Name { get; set; }
   
   public ICollection<Rank> Ranks { get; set; } = new HashSet<Rank>();
   public ICollection<Certification> Certifications { get; set; } = new HashSet<Certification>();
   public ICollection<ExamSession> ExamSessions { get; set; } = new HashSet<ExamSession>();
   
}
