using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniHBYS.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientDemographics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Opsiyonel demografik kolonlar.
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Patients",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Allergies",
                table: "Patients",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BloodType",
                table: "Patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChronicDiseases",
                table: "Patients",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Patients",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "Patients",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactName",
                table: "Patients",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactPhone",
                table: "Patients",
                type: "character varying(15)",
                maxLength: 15,
                nullable: true);

            // Gender: mevcut hastalar için "Belirtilmemiş" = 2.
            migrationBuilder.AddColumn<int>(
                name: "Gender",
                table: "Patients",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            // InsuranceType: mevcut hastalar için SGK = 0.
            migrationBuilder.AddColumn<int>(
                name: "InsuranceType",
                table: "Patients",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // ProtocolNumber önce nullable olarak eklenir, sonra Id'den türetilerek doldurulur.
            migrationBuilder.AddColumn<string>(
                name: "ProtocolNumber",
                table: "Patients",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            // Mevcut satırlar için "P-000001" benzeri protokol numarası üret.
            migrationBuilder.Sql(@"
                UPDATE ""Patients""
                SET ""ProtocolNumber"" = 'P-' || LPAD(""Id""::text, 6, '0')
                WHERE ""ProtocolNumber"" IS NULL;
            ");

            // Artık NOT NULL'a alınabilir ve unique index güvenle oluşturulabilir.
            migrationBuilder.AlterColumn<string>(
                name: "ProtocolNumber",
                table: "Patients",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patients_ProtocolNumber",
                table: "Patients",
                column: "ProtocolNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Patients_ProtocolNumber",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "Allergies",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "BloodType",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "ChronicDiseases",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "District",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "EmergencyContactName",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "EmergencyContactPhone",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "InsuranceType",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "ProtocolNumber",
                table: "Patients");
        }
    }
}
