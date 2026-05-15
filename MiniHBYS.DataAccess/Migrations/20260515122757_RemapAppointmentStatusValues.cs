using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MiniHBYS.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class RemapAppointmentStatusValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // AppointmentStatus enum genişletildi. Mevcut sayısal değerleri yeniden eşle:
            // Eski: 0=Bekliyor, 1=Tamamlandi, 2=IptalEdildi
            // Yeni: 0=Bekliyor, 1=Geldi, 2=MuayenedeAlindi, 3=Tamamlandi, 4=IptalEdildi, 5=Gelmedi
            // Map: 0→0, 1→3, 2→4
            migrationBuilder.Sql(@"
                UPDATE ""Appointments""
                SET ""Status"" = CASE ""Status""
                    WHEN 1 THEN 3
                    WHEN 2 THEN 4
                    ELSE ""Status""
                END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Geri eşle: 3→1, 4→2. Geldi(1), MuayenedeAlindi(2), Gelmedi(5)
            // eski enum'da karşılığı olmadığı için Bekliyor(0)'a düşür.
            migrationBuilder.Sql(@"
                UPDATE ""Appointments""
                SET ""Status"" = CASE ""Status""
                    WHEN 3 THEN 1
                    WHEN 4 THEN 2
                    WHEN 1 THEN 0
                    WHEN 2 THEN 0
                    WHEN 5 THEN 0
                    ELSE ""Status""
                END;
            ");
        }
    }
}
