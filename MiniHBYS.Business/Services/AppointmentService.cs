using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Enums;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class AppointmentService : IAppointmentService
{
    private static readonly TimeSpan SlotDuration = TimeSpan.FromMinutes(30);

    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IAuditService _audit;

    public AppointmentService(AppDbContext context, IMapper mapper, IAuditService audit)
    {
        _context = context;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<ApiResponse<IEnumerable<AppointmentDto>>> GetAllAsync()
    {
        var list = await BaseQuery().OrderByDescending(a => a.DateTime).ToListAsync();
        return ApiResponse<IEnumerable<AppointmentDto>>.Ok(_mapper.Map<IEnumerable<AppointmentDto>>(list));
    }

    public async Task<ApiResponse<AppointmentDto>> GetByIdAsync(int id)
    {
        var entity = await BaseQuery().FirstOrDefaultAsync(a => a.Id == id);
        return entity is null
            ? ApiResponse<AppointmentDto>.Fail("Randevu bulunamadı.")
            : ApiResponse<AppointmentDto>.Ok(_mapper.Map<AppointmentDto>(entity));
    }

    public async Task<ApiResponse<IEnumerable<AppointmentDto>>> GetByPatientIdAsync(int patientId)
    {
        var list = await BaseQuery().Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.DateTime).ToListAsync();
        return ApiResponse<IEnumerable<AppointmentDto>>.Ok(_mapper.Map<IEnumerable<AppointmentDto>>(list));
    }

    public async Task<ApiResponse<IEnumerable<AppointmentDto>>> GetByDoctorIdAsync(int doctorId)
    {
        var list = await BaseQuery().Where(a => a.DoctorId == doctorId)
            .OrderByDescending(a => a.DateTime).ToListAsync();
        return ApiResponse<IEnumerable<AppointmentDto>>.Ok(_mapper.Map<IEnumerable<AppointmentDto>>(list));
    }

    public async Task<ApiResponse<AppointmentDto>> CreateAsync(CreateAppointmentDto dto)
    {
        var when = DateTime.SpecifyKind(dto.DateTime, DateTimeKind.Utc);

        if (when <= DateTime.UtcNow)
            return ApiResponse<AppointmentDto>.Fail("Randevu tarihi geçmiş bir tarih olamaz.");

        if (!await _context.Patients.AnyAsync(p => p.Id == dto.PatientId))
            return ApiResponse<AppointmentDto>.Fail("Hasta bulunamadı.");

        if (!await _context.Doctors.AnyAsync(d => d.Id == dto.DoctorId))
            return ApiResponse<AppointmentDto>.Fail("Doktor bulunamadı.");

        var slotStart = when - SlotDuration + TimeSpan.FromTicks(1);
        var slotEnd = when + SlotDuration - TimeSpan.FromTicks(1);

        var conflict = await _context.Appointments.AnyAsync(a =>
            a.DoctorId == dto.DoctorId &&
            a.Status != AppointmentStatus.IptalEdildi &&
            a.Status != AppointmentStatus.Gelmedi &&
            a.DateTime >= slotStart &&
            a.DateTime <= slotEnd);

        if (conflict)
            return ApiResponse<AppointmentDto>.Fail("Seçilen doktorun bu saatte başka bir randevusu bulunuyor. Lütfen farklı bir saat seçiniz.");

        var entity = new Appointment
        {
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            DateTime = when,
            Status = AppointmentStatus.Bekliyor,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Appointments.Add(entity);
        await _context.SaveChangesAsync();

        await _audit.LogAsync("Appointment", entity.Id, "Create",
            System.Text.Json.JsonSerializer.Serialize(new
            {
                patientId = entity.PatientId,
                doctorId = entity.DoctorId,
                dateTime = entity.DateTime
            }));

        var created = await BaseQuery().FirstAsync(a => a.Id == entity.Id);
        return ApiResponse<AppointmentDto>.Ok(_mapper.Map<AppointmentDto>(created), "Randevu oluşturuldu.");
    }

    public async Task<ApiResponse<AppointmentDto>> UpdateStatusAsync(int id, UpdateAppointmentStatusDto dto, UserRole role)
    {
        var entity = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id);
        if (entity is null) return ApiResponse<AppointmentDto>.Fail("Randevu bulunamadı.");

        var (allowed, allowedRoles) = ResolveTransition(entity.Status, dto.Status);
        if (!allowed)
            return ApiResponse<AppointmentDto>.Fail(
                $"'{StatusText(entity.Status)}' durumundan '{StatusText(dto.Status)}' durumuna geçiş yapılamaz.");

        if (!allowedRoles.Contains(role))
            return ApiResponse<AppointmentDto>.Fail("Bu statü değişikliği için yetkiniz yok.");

        var oldStatus = entity.Status;
        entity.Status = dto.Status;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _audit.LogAsync("Appointment", entity.Id, "StatusChange",
            System.Text.Json.JsonSerializer.Serialize(new
            {
                from = StatusText(oldStatus),
                to = StatusText(entity.Status)
            }));

        var updated = await BaseQuery().FirstAsync(a => a.Id == entity.Id);
        return ApiResponse<AppointmentDto>.Ok(_mapper.Map<AppointmentDto>(updated), "Randevu durumu güncellendi.");
    }

    /// <summary>
    /// İzin verilen statü geçişleri ve bu geçişi yapabilecek roller.
    /// Geri dönüş ve atlama yasak — yalnız aşağıdaki çiftler izinlidir.
    /// </summary>
    private static (bool Allowed, UserRole[] AllowedRoles) ResolveTransition(
        AppointmentStatus current,
        AppointmentStatus target) => (current, target) switch
    {
        (AppointmentStatus.Bekliyor,        AppointmentStatus.Geldi)            => (true, new[] { UserRole.Admin, UserRole.Sekreter }),
        (AppointmentStatus.Bekliyor,        AppointmentStatus.IptalEdildi)      => (true, new[] { UserRole.Admin, UserRole.Sekreter }),
        (AppointmentStatus.Bekliyor,        AppointmentStatus.Gelmedi)          => (true, new[] { UserRole.Admin, UserRole.Sekreter }),
        (AppointmentStatus.Geldi,           AppointmentStatus.MuayenedeAlindi)  => (true, new[] { UserRole.Doktor }),
        (AppointmentStatus.MuayenedeAlindi, AppointmentStatus.Tamamlandi)       => (true, new[] { UserRole.Doktor }),
        _ => (false, Array.Empty<UserRole>())
    };

    private static string StatusText(AppointmentStatus s) => s switch
    {
        AppointmentStatus.Bekliyor => "Bekliyor",
        AppointmentStatus.Geldi => "Geldi",
        AppointmentStatus.MuayenedeAlindi => "Muayenede",
        AppointmentStatus.Tamamlandi => "Tamamlandı",
        AppointmentStatus.IptalEdildi => "İptal Edildi",
        AppointmentStatus.Gelmedi => "Gelmedi",
        _ => s.ToString()
    };

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var entity = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id);
        if (entity is null) return ApiResponse<bool>.Fail("Randevu bulunamadı.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Randevu silindi.");
    }

    private IQueryable<Appointment> BaseQuery() =>
        _context.Appointments.AsNoTracking()
            .Include(a => a.Patient)
            .Include(a => a.Doctor);
}
