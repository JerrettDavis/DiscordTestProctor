using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordTestProctor.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCertificationTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsTemplate",
                table: "Certifications",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsTemplate",
                table: "Certifications");
        }
    }
}
