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
}
