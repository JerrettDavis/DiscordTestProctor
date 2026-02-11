using DiscordTestProctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DiscordTestProctor.Infrastructure.Data.Configurations;

public class CertificationConfiguration : IEntityTypeConfiguration<Certification>
{
    public void Configure(EntityTypeBuilder<Certification> builder)
    {
        builder.Property(c => c.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(c => c.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(c => c.PassingScorePercent)
            .HasDefaultValue(80);

        builder.Property(c => c.IsTemplate)
            .HasDefaultValue(false);

        builder.HasOne(c => c.Guild)
            .WithMany(g => g.Certifications)
            .HasForeignKey(c => c.GuildId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Rank)
            .WithMany()
            .HasForeignKey(c => c.RankId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => new { c.GuildId, c.Name })
            .IsUnique();

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_Certifications_PassingScorePercent",
            "\"PassingScorePercent\" >= 1 AND \"PassingScorePercent\" <= 100"));
    }
}
