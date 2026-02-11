using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiscordTestProctor.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExamSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExamSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GuildId = table.Column<Guid>(type: "uuid", nullable: false),
                    CertificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    DiscordUserId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    DiscordUserName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    CertificationName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RoleDiscordId = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    RoleName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PassingScorePercent = table.Column<int>(type: "integer", nullable: false),
                    QuestionCount = table.Column<int>(type: "integer", nullable: false),
                    CorrectCount = table.Column<int>(type: "integer", nullable: false),
                    ScorePercent = table.Column<int>(type: "integer", nullable: true),
                    Passed = table.Column<bool>(type: "boolean", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastAnswerAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Created = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExamSessions_Certifications_CertificationId",
                        column: x => x.CertificationId,
                        principalTable: "Certifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExamSessions_Guilds_GuildId",
                        column: x => x.GuildId,
                        principalTable: "Guilds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExamSessions_CertificationId",
                table: "ExamSessions",
                column: "CertificationId");

            migrationBuilder.CreateIndex(
                name: "IX_ExamSessions_ExpiresAt",
                table: "ExamSessions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ExamSessions_GuildId_Status",
                table: "ExamSessions",
                columns: new[] { "GuildId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ExamSessions_StartedAt",
                table: "ExamSessions",
                column: "StartedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExamSessions");
        }
    }
}
