using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniHBYS.API.Excel;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;

namespace MiniHBYS.API.Controllers;

[ApiController]
[Route("api/export")]
[Tags("Export")]
[Authorize]
public class ExportController : ControllerBase
{
    private const string XlsxMime =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private readonly IPatientService _patients;
    private readonly IAppointmentService _appointments;
    private readonly IMedicalRecordService _medicalRecords;

    public ExportController(
        IPatientService patients,
        IAppointmentService appointments,
        IMedicalRecordService medicalRecords)
    {
        _patients = patients;
        _appointments = appointments;
        _medicalRecords = medicalRecords;
    }

    /// <summary>Tüm hastaları Excel olarak indirir (Admin ve Sekreter).</summary>
    [HttpGet("patients")]
    [Authorize(Roles = "Admin,Sekreter")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportPatients()
    {
        var result = await _patients.GetAllAsync(page: 1, pageSize: int.MaxValue);
        var data = (IEnumerable<PatientDto>?)result.Data?.Items ?? Array.Empty<PatientDto>();

        var columns = new List<ExcelColumn<PatientDto>>
        {
            new("#", p => p.Id),
            new("Ad Soyad", p => p.FullName),
            new("TC Kimlik No", p => p.NationalId),
            new("Doğum Tarihi", p => p.BirthDate, "dd.MM.yyyy"),
            new("Telefon", p => p.Phone),
            new("E-posta", p => p.Email ?? "—"),
            new("Kayıt Tarihi", p => p.CreatedAt),
        };

        var bytes = ExcelExportBuilder.BuildSingleSheet(
            sheetName: "Hastalar",
            columns: columns,
            rows: data,
            title: "Mini HBYS — Hasta Listesi",
            subtitle: $"Oluşturulma tarihi: {DateTime.Now:dd.MM.yyyy HH:mm} · Toplam {data.Count()} kayıt"
        );

        return File(bytes, XlsxMime, BuildFileName("Hastalar"));
    }

    /// <summary>Randevuları Excel olarak indirir. Doktor yalnızca kendi randevularını alır.</summary>
    [HttpGet("appointments")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportAppointments(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        IEnumerable<AppointmentDto> all;
        if (IsDoctorRole() && TryGetCurrentUserId(out var doctorId))
        {
            var r = await _appointments.GetByDoctorIdAsync(doctorId);
            all = r.Data ?? Array.Empty<AppointmentDto>();
        }
        else
        {
            var r = await _appointments.GetAllAsync(page: 1, pageSize: int.MaxValue);
            all = (IEnumerable<AppointmentDto>?)r.Data?.Items ?? Array.Empty<AppointmentDto>();
        }

        var data = FilterByDate(all, a => a.DateTime, startDate, endDate)
            .OrderBy(a => a.DateTime)
            .ToList();

        var columns = new List<ExcelColumn<AppointmentDto>>
        {
            new("#", a => a.Id),
            new("Tarih & Saat", a => a.DateTime),
            new("Hasta", a => a.PatientFullName),
            new("Doktor", a => a.DoctorName),
            new("Branş", a => a.DoctorBranch),
            new("Tip", a => a.TypeText),
            new("Durum", a => a.StatusText),
            new("Oluşturulma", a => a.CreatedAt),
        };

        var bytes = ExcelExportBuilder.BuildSingleSheet(
            sheetName: "Randevular",
            columns: columns,
            rows: data,
            title: "Mini HBYS — Randevu Listesi",
            subtitle: BuildSubtitle(data.Count, startDate, endDate)
        );

        return File(bytes, XlsxMime, BuildFileName("Randevular"));
    }

    /// <summary>Muayene kayıtlarını Excel olarak indirir. Doktor yalnızca kendi kayıtlarını alır.</summary>
    [HttpGet("medical-records")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportMedicalRecords(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        IEnumerable<MedicalRecordDto> all;
        if (IsDoctorRole() && TryGetCurrentUserId(out var doctorId))
        {
            var r = await _medicalRecords.GetByDoctorIdAsync(doctorId);
            all = r.Data ?? Array.Empty<MedicalRecordDto>();
        }
        else
        {
            var r = await _medicalRecords.GetAllAsync(page: 1, pageSize: int.MaxValue);
            all = (IEnumerable<MedicalRecordDto>?)r.Data?.Items ?? Array.Empty<MedicalRecordDto>();
        }

        var data = FilterByDate(all, m => m.AppointmentDate, startDate, endDate)
            .OrderByDescending(m => m.AppointmentDate)
            .ToList();

        var columns = new List<ExcelColumn<MedicalRecordDto>>
        {
            new("#", m => m.Id),
            new("Randevu Tarihi", m => m.AppointmentDate),
            new("Hasta", m => m.PatientFullName),
            new("Doktor", m => m.DoctorName),
            new("Branş", m => m.DoctorBranch),
            new("Tanı", m => m.Diagnosis),
            new("Notlar", m => string.IsNullOrWhiteSpace(m.Notes) ? "—" : m.Notes),
            new("Kayıt Tarihi", m => m.CreatedAt),
        };

        var bytes = ExcelExportBuilder.BuildSingleSheet(
            sheetName: "Muayene Kayıtları",
            columns: columns,
            rows: data,
            title: "Mini HBYS — Muayene Kayıtları",
            subtitle: BuildSubtitle(data.Count, startDate, endDate)
        );

        return File(bytes, XlsxMime, BuildFileName("Muayene_Kayitlari"));
    }

    private static IEnumerable<T> FilterByDate<T>(
        IEnumerable<T> source,
        Func<T, DateTime> selector,
        DateTime? startDate,
        DateTime? endDate)
    {
        if (startDate is null && endDate is null) return source;

        var start = startDate?.Date ?? DateTime.MinValue;
        var end = endDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.MaxValue;
        if (start.Kind == DateTimeKind.Unspecified) start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
        if (end.Kind == DateTimeKind.Unspecified) end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

        return source.Where(x =>
        {
            var d = selector(x);
            return d >= start && d <= end;
        });
    }

    private static string BuildSubtitle(int count, DateTime? startDate, DateTime? endDate)
    {
        var range = (startDate, endDate) switch
        {
            (null, null) => "Tüm tarihler",
            (DateTime s, null) => $"{s:dd.MM.yyyy} ve sonrası",
            (null, DateTime e) => $"{e:dd.MM.yyyy} ve öncesi",
            (DateTime s, DateTime e) => $"{s:dd.MM.yyyy} – {e:dd.MM.yyyy}"
        };
        return $"Oluşturulma tarihi: {DateTime.Now:dd.MM.yyyy HH:mm} · {range} · Toplam {count} kayıt";
    }

    private static string BuildFileName(string baseName) =>
        $"{baseName}_{DateTime.Now:yyyyMMdd}.xlsx";

    private bool IsDoctorRole() => User.IsInRole("Doktor");

    private bool TryGetCurrentUserId(out int doctorId)
    {
        var claim = User.FindFirstValue("doctorId");
        return int.TryParse(claim, out doctorId);
    }
}
