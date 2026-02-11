using DiscordTestProctor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DiscordTestProctor.Infrastructure.Data.Configurations;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.Property(q => q.Text)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Ignore(q => q.CorrectAnswer);

        builder.HasOne(q => q.Certification)
            .WithMany(c => c.Questions)
            .HasForeignKey(q => q.CertificationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
