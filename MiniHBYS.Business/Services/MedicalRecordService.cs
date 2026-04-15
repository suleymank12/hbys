using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Enums;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class MedicalRecordService : IMedicalRecordService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public MedicalRecordService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApiResponse<IEnumerable<MedicalRecordDto>>> GetAllAsync()
    {
        var list = await BaseQuery().OrderByDescending(m => m.CreatedAt).ToListAsync();
        return ApiResponse<IEnumerable<MedicalRecordDto>>.Ok(_mapper.Map<IEnumerable<MedicalRecordDto>>(list));
    }

    public async Task<ApiResponse<MedicalRecordDto>> GetByIdAsync(int id)
    {
        var entity = await BaseQuery().FirstOrDefaultAsync(m => m.Id == id);
        return entity is null
            ? ApiResponse<MedicalRecordDto>.Fail("Muayene kaydı bulunamadı.")
            : ApiResponse<MedicalRecordDto>.Ok(_mapper.Map<MedicalRecordDto>(entity));
    }

    public async Task<ApiResponse<MedicalRecordDto>> GetByAppointmentIdAsync(int appointmentId)
    {
        var entity = await BaseQuery().FirstOrDefaultAsync(m => m.AppointmentId == appointmentId);
        return entity is null
            ? ApiResponse<MedicalRecordDto>.Fail("Bu randevuya ait muayene kaydı bulunamadı.")
            : ApiResponse<MedicalRecordDto>.Ok(_mapper.Map<MedicalRecordDto>(entity));
    }

    public async Task<ApiResponse<IEnumerable<MedicalRecordDto>>> GetByPatientIdAsync(int patientId)
    {
        var list = await BaseQuery()
            .Where(m => m.Appointment.PatientId == patientId)
            .OrderByDescending(m => m.Appointment.DateTime)
            .ToListAsync();
        return ApiResponse<IEnumerable<MedicalRecordDto>>.Ok(_mapper.Map<IEnumerable<MedicalRecordDto>>(list));
    }

    public async Task<ApiResponse<MedicalRecordDto>> CreateAsync(CreateMedicalRecordDto dto)
    {
        var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);
        if (appointment is null)
            return ApiResponse<MedicalRecordDto>.Fail("Randevu bulunamadı.");

        if (appointment.Status != AppointmentStatus.Tamamlandi)
            return ApiResponse<MedicalRecordDto>.Fail("Yalnızca tamamlanmış randevulara muayene kaydı oluşturulabilir.");

        if (await _context.MedicalRecords.AnyAsync(m => m.AppointmentId == dto.AppointmentId))
            return ApiResponse<MedicalRecordDto>.Fail("Bu randevuya ait bir muayene kaydı zaten mevcut.");

        var entity = new MedicalRecord
        {
            AppointmentId = dto.AppointmentId,
            Diagnosis = dto.Diagnosis,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.MedicalRecords.Add(entity);
        await _context.SaveChangesAsync();

        var created = await BaseQuery().FirstAsync(m => m.Id == entity.Id);
        return ApiResponse<MedicalRecordDto>.Ok(_mapper.Map<MedicalRecordDto>(created), "Muayene kaydı oluşturuldu.");
    }

    public async Task<ApiResponse<MedicalRecordDto>> UpdateAsync(int id, UpdateMedicalRecordDto dto)
    {
        var entity = await _context.MedicalRecords.FirstOrDefaultAsync(m => m.Id == id);
        if (entity is null) return ApiResponse<MedicalRecordDto>.Fail("Muayene kaydı bulunamadı.");

        entity.Diagnosis = dto.Diagnosis;
        entity.Notes = dto.Notes;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var updated = await BaseQuery().FirstAsync(m => m.Id == entity.Id);
        return ApiResponse<MedicalRecordDto>.Ok(_mapper.Map<MedicalRecordDto>(updated), "Muayene kaydı güncellendi.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var entity = await _context.MedicalRecords.FirstOrDefaultAsync(m => m.Id == id);
        if (entity is null) return ApiResponse<bool>.Fail("Muayene kaydı bulunamadı.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Muayene kaydı silindi.");
    }

    private IQueryable<MedicalRecord> BaseQuery() =>
        _context.MedicalRecords.AsNoTracking()
            .Include(m => m.Appointment).ThenInclude(a => a.Patient)
            .Include(m => m.Appointment).ThenInclude(a => a.Doctor);
}
