using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MiniHBYS.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class SplitUserAndDoctor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Create the new Users table.
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Password = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            // 2) Add a nullable UserId column on Doctors so we can backfill it.
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Doctors",
                type: "integer",
                nullable: true);

            // 3) Copy every existing Doctors row into Users (admin/sekreter sahte
            //    doktor satırları dahil — bu sayede oturum açma sürmeye devam eder).
            migrationBuilder.Sql(@"
                INSERT INTO ""Users"" (""Name"", ""Email"", ""Password"", ""Role"", ""CreatedAt"", ""UpdatedAt"", ""IsActive"")
                SELECT ""Name"", ""Email"", ""Password"", ""Role"", ""CreatedAt"", ""UpdatedAt"", ""IsActive""
                FROM ""Doctors"";
            ");

            // 4) Backfill Doctors.UserId by matching emails (eski Email kolonu hâlâ var).
            migrationBuilder.Sql(@"
                UPDATE ""Doctors"" d
                SET ""UserId"" = u.""Id""
                FROM ""Users"" u
                WHERE u.""Email"" = d.""Email"";
            ");

            // 5) Admin (Role=0) ve Sekreter (Role=2) gerçek doktor değil — Doctors'tan sil.
            //    Bu satırların User kayıtları korunur (yukarıdaki INSERT ile taşındı).
            migrationBuilder.Sql(@"
                DELETE FROM ""Doctors"" WHERE ""Role"" <> 1;
            ");

            // 6) UserId artık NOT NULL olabilir + unique index + FK.
            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Doctors",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_UserId",
                table: "Doctors",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Doctors_Users_UserId",
                table: "Doctors",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // 7) Eski sütun ve indexleri kaldır.
            migrationBuilder.DropIndex(
                name: "IX_Doctors_Email",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "Password",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Doctors");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Geri alma: User verilerini tekrar Doctors'a kopyala.
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Doctors",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Password",
                table: "Doctors",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "Doctors",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.Sql(@"
                UPDATE ""Doctors"" d
                SET ""Email"" = u.""Email"",
                    ""Password"" = u.""Password"",
                    ""Role"" = u.""Role""
                FROM ""Users"" u
                WHERE u.""Id"" = d.""UserId"";
            ");

            migrationBuilder.DropForeignKey(
                name: "FK_Doctors_Users_UserId",
                table: "Doctors");

            migrationBuilder.DropIndex(
                name: "IX_Doctors_UserId",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Doctors");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_Email",
                table: "Doctors",
                column: "Email",
                unique: true);
        }
    }
}
