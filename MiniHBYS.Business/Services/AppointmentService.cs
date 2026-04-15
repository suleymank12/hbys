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

    public AppointmentService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
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

        var created = await BaseQuery().FirstAsync(a => a.Id == entity.Id);
        return ApiResponse<AppointmentDto>.Ok(_mapper.Map<AppointmentDto>(created), "Randevu oluşturuldu.");
    }

    public async Task<ApiResponse<AppointmentDto>> UpdateStatusAsync(int id, UpdateAppointmentStatusDto dto)
    {
        var entity = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == id);
        if (entity is null) return ApiResponse<AppointmentDto>.Fail("Randevu bulunamadı.");

        if (entity.Status != AppointmentStatus.Bekliyor)
            return ApiResponse<AppointmentDto>.Fail("Yalnızca 'Bekliyor' statüsündeki randevunun durumu değiştirilebilir.");

        if (dto.Status != AppointmentStatus.Tamamlandi && dto.Status != AppointmentStatus.IptalEdildi)
            return ApiResponse<AppointmentDto>.Fail("Geçersiz hedef statü. Tamamlandı veya İptal Edildi olmalıdır.");

        entity.Status = dto.Status;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var updated = await BaseQuery().FirstAsync(a => a.Id == entity.Id);
        return ApiResponse<AppointmentDto>.Ok(_mapper.Map<AppointmentDto>(updated), "Randevu durumu güncellendi.");
    }

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
