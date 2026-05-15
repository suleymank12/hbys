using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniHBYS.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddIcd10AndDiagnosisCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DiagnosisCode",
                table: "MedicalRecords",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Icd10Codes",
                columns: table => new
                {
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    NameTr = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Icd10Codes", x => x.Code);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Icd10Codes_NameTr",
                table: "Icd10Codes",
                column: "NameTr");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Icd10Codes");

            migrationBuilder.DropColumn(
                name: "DiagnosisCode",
                table: "MedicalRecords");
        }
    }
}
