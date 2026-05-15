using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MiniHBYS.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class SoapMedicalRecordAndVitals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChiefComplaint",
                table: "MedicalRecords",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            // Mevcut muayene kayıtları için Şikayet alanını geçici olarak Tanı
            // değerinden türet — veri kayıpsız geçiş.
            migrationBuilder.Sql(@"
                UPDATE ""MedicalRecords""
                SET ""ChiefComplaint"" = ""Diagnosis""
                WHERE ""ChiefComplaint"" = '' AND ""Diagnosis"" IS NOT NULL;
            ");

            migrationBuilder.AddColumn<string>(
                name: "Examination",
                table: "MedicalRecords",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "History",
                table: "MedicalRecords",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TreatmentPlan",
                table: "MedicalRecords",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VitalSigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MedicalRecordId = table.Column<int>(type: "integer", nullable: false),
                    BloodPressureSystolic = table.Column<int>(type: "integer", nullable: true),
                    BloodPressureDiastolic = table.Column<int>(type: "integer", nullable: true),
                    Pulse = table.Column<int>(type: "integer", nullable: true),
                    Temperature = table.Column<decimal>(type: "numeric(4,1)", precision: 4, scale: 1, nullable: true),
                    RespiratoryRate = table.Column<int>(type: "integer", nullable: true),
                    OxygenSaturation = table.Column<int>(type: "integer", nullable: true),
                    Height = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: true),
                    Weight = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VitalSigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VitalSigns_MedicalRecords_MedicalRecordId",
                        column: x => x.MedicalRecordId,
                        principalTable: "MedicalRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VitalSigns_MedicalRecordId",
                table: "VitalSigns",
                column: "MedicalRecordId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VitalSigns");

            migrationBuilder.DropColumn(
                name: "ChiefComplaint",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Examination",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "History",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "TreatmentPlan",
                table: "MedicalRecords");
        }
    }
}
