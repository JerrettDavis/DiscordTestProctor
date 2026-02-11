using DiscordTestProctor.Domain.Entities;

namespace DiscordTestProctor.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Guild> Guilds { get; }
    DbSet<Rank> Ranks { get; }
    DbSet<Certification> Certifications { get; }
    DbSet<Question> Questions { get; }
    DbSet<Answer> Answers { get; }
    DbSet<ExamSession> ExamSessions { get; }

    DbSet<TodoList> TodoLists { get; }

    DbSet<TodoItem> TodoItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
