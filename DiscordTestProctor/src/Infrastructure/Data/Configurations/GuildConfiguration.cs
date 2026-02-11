using DiscordTestProctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DiscordTestProctor.Infrastructure.Data.Configurations;

public class GuildConfiguration : IEntityTypeConfiguration<Guild>
{
    public void Configure(EntityTypeBuilder<Guild> builder)
    {
        builder.Property(g => g.GuildId)
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(g => g.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.HasIndex(g => g.GuildId)
            .IsUnique();
    }
}
