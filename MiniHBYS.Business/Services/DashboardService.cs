using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Enums;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<DashboardStatsDto>> GetStatsAsync()
    {
        var todayStart = DateTime.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);

        var totalPatients = await _context.Patients.CountAsync();
        var totalDoctors = await _context.Doctors.CountAsync();

        var todayAppointments = await _context.Appointments
            .CountAsync(a => a.DateTime >= todayStart && a.DateTime < todayEnd);

        var pending = await _context.Appointments.CountAsync(a => a.Status == AppointmentStatus.Bekliyor);
        var completed = await _context.Appointments.CountAsync(a => a.Status == AppointmentStatus.Tamamlandi);
        var cancelled = await _context.Appointments.CountAsync(a => a.Status == AppointmentStatus.IptalEdildi);

        var doctorsByBranch = await _context.Doctors
            .GroupBy(d => d.Branch)
            .Select(g => new { Branch = g.Key, Count = g.Count() })
            .ToListAsync();

        var apptsByBranch = await _context.Appointments
            .Include(a => a.Doctor)
            .GroupBy(a => a.Doctor.Branch)
            .Select(g => new { Branch = g.Key, Count = g.Count() })
            .ToListAsync();

        var branchStats = doctorsByBranch
            .Select(d => new BranchStatDto
            {
                Branch = d.Branch,
                DoctorCount = d.Count,
                AppointmentCount = apptsByBranch.FirstOrDefault(a => a.Branch == d.Branch)?.Count ?? 0
            })
            .OrderBy(b => b.Branch)
            .ToList();

        var dto = new DashboardStatsDto
        {
            TotalPatients = totalPatients,
            TotalDoctors = totalDoctors,
            TodayAppointments = todayAppointments,
            PendingAppointments = pending,
            CompletedAppointments = completed,
            CancelledAppointments = cancelled,
            BranchStats = branchStats
        };

        return ApiResponse<DashboardStatsDto>.Ok(dto);
    }

    public async Task<ApiResponse<IEnumerable<TodayAppointmentDto>>> GetTodayAppointmentsAsync()
    {
        var todayStart = DateTime.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);

        var list = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)
            .Include(a => a.Doctor)
            .Where(a => a.DateTime >= todayStart && a.DateTime < todayEnd)
            .OrderBy(a => a.DateTime)
            .Take(10)
            .ToListAsync();

        var result = list.Select(a => new TodayAppointmentDto
        {
            Id = a.Id,
            DateTime = a.DateTime,
            PatientFullName = a.Patient != null ? $"{a.Patient.Name} {a.Patient.Surname}" : string.Empty,
            DoctorName = a.Doctor != null
                ? BuildDoctorName(a.Doctor.Title, a.Doctor.Name)
                : string.Empty,
            DoctorBranch = a.Doctor?.Branch ?? string.Empty,
            Status = a.Status,
            StatusText = GetStatusText(a.Status),
            Type = a.Type,
            TypeText = GetTypeText(a.Type)
        });

        return ApiResponse<IEnumerable<TodayAppointmentDto>>.Ok(result);
    }

    public async Task<ApiResponse<IEnumerable<RecentMedicalRecordDto>>> GetRecentMedicalRecordsAsync(int limit = 5)
    {
        if (limit < 1) limit = 5;
        if (limit > 50) limit = 50;

        var list = await _context.MedicalRecords
            .AsNoTracking()
            .Include(m => m.Appointment).ThenInclude(a => a!.Patient)
            .Include(m => m.Appointment).ThenInclude(a => a!.Doctor)
            .OrderByDescending(m => m.CreatedAt)
            .Take(limit)
            .ToListAsync();

        var result = list.Select(m => new RecentMedicalRecordDto
        {
            Id = m.Id,
            AppointmentId = m.AppointmentId,
            AppointmentDate = m.Appointment != null ? m.Appointment.DateTime : default,
            PatientFullName = m.Appointment != null && m.Appointment.Patient != null
                ? $"{m.Appointment.Patient.Name} {m.Appointment.Patient.Surname}"
                : string.Empty,
            DoctorName = m.Appointment != null && m.Appointment.Doctor != null
                ? BuildDoctorName(m.Appointment.Doctor.Title, m.Appointment.Doctor.Name)
                : string.Empty,
            DoctorBranch = m.Appointment != null && m.Appointment.Doctor != null
                ? m.Appointment.Doctor.Branch
                : string.Empty,
            Diagnosis = m.Diagnosis,
            DiagnosisCode = m.DiagnosisCode
        });

        return ApiResponse<IEnumerable<RecentMedicalRecordDto>>.Ok(result);
    }

    public async Task<ApiResponse<IEnumerable<DoctorStatDto>>> GetDoctorStatsAsync()
    {
        var doctors = await _context.Doctors
            .AsNoTracking()
            .Select(d => new
            {
                d.Id,
                d.Title,
                d.Name,
                d.Branch,
                Total = d.Appointments.Count(),
                Completed = d.Appointments.Count(a => a.Status == AppointmentStatus.Tamamlandi),
                Pending = d.Appointments.Count(a => a.Status == AppointmentStatus.Bekliyor)
            })
            .OrderBy(d => d.Branch)
            .ThenBy(d => d.Name)
            .ToListAsync();

        var result = doctors.Select(d => new DoctorStatDto
        {
            DoctorId = d.Id,
            DoctorName = BuildDoctorName(d.Title, d.Name),
            Branch = d.Branch,
            TotalAppointments = d.Total,
            CompletedAppointments = d.Completed,
            PendingAppointments = d.Pending
        });

        return ApiResponse<IEnumerable<DoctorStatDto>>.Ok(result);
    }

    private static string BuildDoctorName(string? title, string name) =>
        string.IsNullOrWhiteSpace(title) ? name : $"{title.Trim()} {name}";

    private static string GetStatusText(AppointmentStatus status) => status switch
    {
        AppointmentStatus.Bekliyor => "Bekliyor",
        AppointmentStatus.Geldi => "Geldi",
        AppointmentStatus.MuayenedeAlindi => "Muayenede",
        AppointmentStatus.Tamamlandi => "Tamamlandı",
        AppointmentStatus.IptalEdildi => "İptal Edildi",
        AppointmentStatus.Gelmedi => "Gelmedi",
        _ => status.ToString()
    };

    private static string GetTypeText(AppointmentType type) => type switch
    {
        AppointmentType.Poliklinik => "Poliklinik",
        AppointmentType.Kontrol => "Kontrol",
        AppointmentType.Acil => "Acil",
        _ => type.ToString()
    };
}
