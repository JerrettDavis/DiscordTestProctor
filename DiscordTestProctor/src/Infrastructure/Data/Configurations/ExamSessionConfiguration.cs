using DiscordTestProctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DiscordTestProctor.Infrastructure.Data.Configurations;

public class ExamSessionConfiguration : IEntityTypeConfiguration<ExamSession>
{
    public void Configure(EntityTypeBuilder<ExamSession> builder)
    {
        builder.Property(s => s.DiscordUserId)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(s => s.DiscordUserName)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(s => s.CertificationName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(s => s.RoleDiscordId)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(s => s.RoleName)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasOne(s => s.Guild)
            .WithMany(g => g.ExamSessions)
            .HasForeignKey(s => s.GuildId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Certification)
            .WithMany()
            .HasForeignKey(s => s.CertificationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => new { s.GuildId, s.Status });
        builder.HasIndex(s => s.ExpiresAt);
        builder.HasIndex(s => s.StartedAt);
    }
}
