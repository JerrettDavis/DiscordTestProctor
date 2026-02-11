using System.Reflection;
using DiscordTestProctor.Application.Common.Interfaces;
using DiscordTestProctor.Domain.Entities;
using DiscordTestProctor.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace DiscordTestProctor.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options), IApplicationDbContext
{
    public DbSet<Guild> Guilds => Set<Guild>();

    public DbSet<Rank> Ranks => Set<Rank>();

    public DbSet<Certification> Certifications => Set<Certification>();

    public DbSet<Question> Questions => Set<Question>();

    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<ExamSession> ExamSessions => Set<ExamSession>();

    public DbSet<TodoList> TodoLists => Set<TodoList>();

    public DbSet<TodoItem> TodoItems => Set<TodoItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ConfigureWarnings(a =>
            a.Ignore(RelationalEventId.PendingModelChangesWarning));
    }
}
