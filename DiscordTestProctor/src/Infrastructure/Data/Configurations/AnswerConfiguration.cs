using DiscordTestProctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DiscordTestProctor.Infrastructure.Data.Configurations;

public class AnswerConfiguration : IEntityTypeConfiguration<Answer>
{
    public void Configure(EntityTypeBuilder<Answer> builder)
    {
        builder.Property(a => a.Text)
            .HasMaxLength(1000)
            .IsRequired();

        builder.HasOne(a => a.Question)
            .WithMany(q => q.Answers)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => new { a.QuestionId, a.Order })
            .IsUnique();

        builder.HasIndex(a => new { a.QuestionId, a.IsCorrect })
            .IsUnique()
            .HasFilter("\"IsCorrect\" = true");
    }
}
