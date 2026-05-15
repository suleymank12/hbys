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
    private readonly IAuditService _audit;

    public MedicalRecordService(AppDbContext context, IMapper mapper, IAuditService audit)
    {
        _context = context;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<ApiResponse<PagedResult<MedicalRecordDto>>> GetAllAsync(int page = 1, int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = BaseQuery();
        var total = await query.CountAsync();

        var list = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var paged = PagedResult<MedicalRecordDto>.Create(
            _mapper.Map<List<MedicalRecordDto>>(list),
            total, page, pageSize);

        return ApiResponse<PagedResult<MedicalRecordDto>>.Ok(paged);
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

    public async Task<ApiResponse<IEnumerable<MedicalRecordDto>>> GetByDoctorIdAsync(int doctorId)
    {
        var list = await BaseQuery()
            .Where(m => m.Appointment.DoctorId == doctorId)
            .OrderByDescending(m => m.Appointment.DateTime)
            .ToListAsync();
        return ApiResponse<IEnumerable<MedicalRecordDto>>.Ok(_mapper.Map<IEnumerable<MedicalRecordDto>>(list));
    }

    public async Task<ApiResponse<MedicalRecordDto>> CreateAsync(CreateMedicalRecordDto dto, int doctorId)
    {
        var appointment = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == dto.AppointmentId);
        if (appointment is null)
            return ApiResponse<MedicalRecordDto>.Fail("Randevu bulunamadı.");

        if (appointment.DoctorId != doctorId)
            return ApiResponse<MedicalRecordDto>.Fail("Bu randevu size ait değil, muayene kaydı oluşturamazsınız.");

        if (appointment.Status != AppointmentStatus.Tamamlandi)
            return ApiResponse<MedicalRecordDto>.Fail("Yalnızca tamamlanmış randevulara muayene kaydı oluşturulabilir.");

        if (await _context.MedicalRecords.AnyAsync(m => m.AppointmentId == dto.AppointmentId))
            return ApiResponse<MedicalRecordDto>.Fail("Bu randevuya ait bir muayene kaydı zaten mevcut.");

        var entity = new MedicalRecord
        {
            AppointmentId = dto.AppointmentId,
            ChiefComplaint = dto.ChiefComplaint,
            History = dto.History,
            Examination = dto.Examination,
            Diagnosis = dto.Diagnosis,
            DiagnosisCode = string.IsNullOrWhiteSpace(dto.DiagnosisCode) ? null : dto.DiagnosisCode.Trim(),
            TreatmentPlan = dto.TreatmentPlan,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.MedicalRecords.Add(entity);
        await _context.SaveChangesAsync();

        if (HasAnyVital(dto.VitalSigns))
        {
            _context.VitalSigns.Add(BuildVitalsEntity(entity.Id, dto.VitalSigns!));
            await _context.SaveChangesAsync();
        }

        await _audit.LogAsync("MedicalRecord", entity.Id, "Create",
            $"Muayene kaydı oluşturuldu. Tanı: {entity.Diagnosis}{(entity.DiagnosisCode is null ? "" : $" ({entity.DiagnosisCode})")}");

        var created = await BaseQuery().FirstAsync(m => m.Id == entity.Id);
        return ApiResponse<MedicalRecordDto>.Ok(_mapper.Map<MedicalRecordDto>(created), "Muayene kaydı oluşturuldu.");
    }

    public async Task<ApiResponse<MedicalRecordDto>> UpdateAsync(int id, UpdateMedicalRecordDto dto, int doctorId)
    {
        var entity = await _context.MedicalRecords
            .Include(m => m.VitalSigns)
            .Include(m => m.Appointment)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (entity is null) return ApiResponse<MedicalRecordDto>.Fail("Muayene kaydı bulunamadı.");

        if (entity.Appointment.DoctorId != doctorId)
            return ApiResponse<MedicalRecordDto>.Fail("Bu muayene kaydı size ait değil, düzenleyemezsiniz.");

        entity.ChiefComplaint = dto.ChiefComplaint;
        entity.History = dto.History;
        entity.Examination = dto.Examination;
        entity.Diagnosis = dto.Diagnosis;
        entity.DiagnosisCode = string.IsNullOrWhiteSpace(dto.DiagnosisCode) ? null : dto.DiagnosisCode.Trim();
        entity.TreatmentPlan = dto.TreatmentPlan;
        entity.Notes = dto.Notes;
        entity.UpdatedAt = DateTime.UtcNow;

        // VitalSigns upsert (varsa).
        if (HasAnyVital(dto.VitalSigns))
        {
            if (entity.VitalSigns is null)
            {
                _context.VitalSigns.Add(BuildVitalsEntity(entity.Id, dto.VitalSigns!));
            }
            else
            {
                ApplyVitals(entity.VitalSigns, dto.VitalSigns!);
                entity.VitalSigns.UpdatedAt = DateTime.UtcNow;
            }
        }
        else if (entity.VitalSigns is not null)
        {
            // Tüm vital alanları boşaltıldıysa kaydı pasifleştir.
            entity.VitalSigns.IsActive = false;
            entity.VitalSigns.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        await _audit.LogAsync("MedicalRecord", entity.Id, "Update",
            $"Muayene kaydı güncellendi. Tanı: {entity.Diagnosis}{(entity.DiagnosisCode is null ? "" : $" ({entity.DiagnosisCode})")}");

        var updated = await BaseQuery().FirstAsync(m => m.Id == entity.Id);
        return ApiResponse<MedicalRecordDto>.Ok(_mapper.Map<MedicalRecordDto>(updated), "Muayene kaydı güncellendi.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var entity = await _context.MedicalRecords
            .Include(m => m.VitalSigns)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (entity is null) return ApiResponse<bool>.Fail("Muayene kaydı bulunamadı.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        if (entity.VitalSigns is not null)
        {
            entity.VitalSigns.IsActive = false;
            entity.VitalSigns.UpdatedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Muayene kaydı silindi.");
    }

    private static bool HasAnyVital(VitalSignsDto? v) =>
        v is not null && (
            v.BloodPressureSystolic.HasValue ||
            v.BloodPressureDiastolic.HasValue ||
            v.Pulse.HasValue ||
            v.Temperature.HasValue ||
            v.RespiratoryRate.HasValue ||
            v.OxygenSaturation.HasValue ||
            v.Height.HasValue ||
            v.Weight.HasValue);

    private static VitalSigns BuildVitalsEntity(int medicalRecordId, VitalSignsDto v) => new()
    {
        MedicalRecordId = medicalRecordId,
        BloodPressureSystolic = v.BloodPressureSystolic,
        BloodPressureDiastolic = v.BloodPressureDiastolic,
        Pulse = v.Pulse,
        Temperature = v.Temperature,
        RespiratoryRate = v.RespiratoryRate,
        OxygenSaturation = v.OxygenSaturation,
        Height = v.Height,
        Weight = v.Weight,
        CreatedAt = DateTime.UtcNow,
        IsActive = true
    };

    private static void ApplyVitals(VitalSigns target, VitalSignsDto v)
    {
        target.BloodPressureSystolic = v.BloodPressureSystolic;
        target.BloodPressureDiastolic = v.BloodPressureDiastolic;
        target.Pulse = v.Pulse;
        target.Temperature = v.Temperature;
        target.RespiratoryRate = v.RespiratoryRate;
        target.OxygenSaturation = v.OxygenSaturation;
        target.Height = v.Height;
        target.Weight = v.Weight;
        target.IsActive = true;
    }

    private IQueryable<MedicalRecord> BaseQuery() =>
        _context.MedicalRecords.AsNoTracking()
            .Include(m => m.Appointment).ThenInclude(a => a.Patient)
            .Include(m => m.Appointment).ThenInclude(a => a.Doctor)
            .Include(m => m.VitalSigns)
            .Include(m => m.Prescription!).ThenInclude(p => p.Items);
}
