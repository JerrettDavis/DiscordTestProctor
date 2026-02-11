using DiscordTestProctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DiscordTestProctor.Infrastructure.Data.Configurations;

public class RankConfiguration : IEntityTypeConfiguration<Rank>
{
    public void Configure(EntityTypeBuilder<Rank> builder)
    {
        builder.Property(r => r.RankId)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(r => r.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasOne(r => r.Guild)
            .WithMany(g => g.Ranks)
            .HasForeignKey(r => r.GuildId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.GuildId, r.RankId })
            .IsUnique();
    }
}
