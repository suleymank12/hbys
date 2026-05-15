using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public PrescriptionService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PrescriptionDto>> GetByMedicalRecordIdAsync(int medicalRecordId)
    {
        var entity = await BaseQuery().FirstOrDefaultAsync(p => p.MedicalRecordId == medicalRecordId);
        return entity is null
            ? ApiResponse<PrescriptionDto>.Fail("Bu muayene kaydı için reçete bulunamadı.")
            : ApiResponse<PrescriptionDto>.Ok(_mapper.Map<PrescriptionDto>(entity));
    }

    public async Task<ApiResponse<IEnumerable<PrescriptionDto>>> GetByPatientIdAsync(int patientId)
    {
        var list = await BaseQuery()
            .Where(p => p.MedicalRecord.Appointment.PatientId == patientId)
            .OrderByDescending(p => p.PrescribedAt)
            .ToListAsync();
        return ApiResponse<IEnumerable<PrescriptionDto>>.Ok(_mapper.Map<IEnumerable<PrescriptionDto>>(list));
    }

    public async Task<ApiResponse<IEnumerable<PrescriptionDto>>> GetByDoctorIdAsync(int doctorId)
    {
        var list = await BaseQuery()
            .Where(p => p.MedicalRecord.Appointment.DoctorId == doctorId)
            .OrderByDescending(p => p.PrescribedAt)
            .ToListAsync();
        return ApiResponse<IEnumerable<PrescriptionDto>>.Ok(_mapper.Map<IEnumerable<PrescriptionDto>>(list));
    }

    public async Task<ApiResponse<PrescriptionDto>> CreateAsync(CreatePrescriptionDto dto, int doctorId)
    {
        var medicalRecord = await _context.MedicalRecords
            .Include(m => m.Appointment)
            .FirstOrDefaultAsync(m => m.Id == dto.MedicalRecordId);
        if (medicalRecord is null)
            return ApiResponse<PrescriptionDto>.Fail("Muayene kaydı bulunamadı.");

        if (medicalRecord.Appointment.DoctorId != doctorId)
            return ApiResponse<PrescriptionDto>.Fail("Bu muayene kaydı size ait değil, reçete yazamazsınız.");

        if (await _context.Prescriptions.AnyAsync(p => p.MedicalRecordId == dto.MedicalRecordId))
            return ApiResponse<PrescriptionDto>.Fail("Bu muayene kaydı için zaten bir reçete mevcut.");

        if (dto.Items.Count == 0)
            return ApiResponse<PrescriptionDto>.Fail("Reçete en az bir ilaç içermelidir.");

        var entity = new Prescription
        {
            MedicalRecordId = dto.MedicalRecordId,
            PrescriptionNumber = await GeneratePrescriptionNumberAsync(),
            PrescribedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            IsActive = true,
            Items = dto.Items.Select(BuildItem).ToList()
        };

        _context.Prescriptions.Add(entity);
        await _context.SaveChangesAsync();

        var created = await BaseQuery().FirstAsync(p => p.Id == entity.Id);
        return ApiResponse<PrescriptionDto>.Ok(_mapper.Map<PrescriptionDto>(created), "Reçete oluşturuldu.");
    }

    public async Task<ApiResponse<PrescriptionDto>> UpdateAsync(int id, UpdatePrescriptionDto dto, int doctorId)
    {
        var entity = await _context.Prescriptions
            .Include(p => p.Items)
            .Include(p => p.MedicalRecord)
                .ThenInclude(m => m.Appointment)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (entity is null)
            return ApiResponse<PrescriptionDto>.Fail("Reçete bulunamadı.");

        if (entity.MedicalRecord.Appointment.DoctorId != doctorId)
            return ApiResponse<PrescriptionDto>.Fail("Bu reçete size ait değil, düzenleyemezsiniz.");

        if (dto.Items.Count == 0)
            return ApiResponse<PrescriptionDto>.Fail("Reçete en az bir ilaç içermelidir.");

        // Mevcut ilaçları temizle, yenilerini ekle (replace-all stratejisi).
        _context.PrescriptionItems.RemoveRange(entity.Items);
        entity.Items = dto.Items.Select(BuildItem).ToList();
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var updated = await BaseQuery().FirstAsync(p => p.Id == entity.Id);
        return ApiResponse<PrescriptionDto>.Ok(_mapper.Map<PrescriptionDto>(updated), "Reçete güncellendi.");
    }

    private static PrescriptionItem BuildItem(CreatePrescriptionItemDto i) => new()
    {
        MedicationName = i.MedicationName.Trim(),
        Dosage = i.Dosage.Trim(),
        Frequency = i.Frequency.Trim(),
        Duration = i.Duration.Trim(),
        Instructions = string.IsNullOrWhiteSpace(i.Instructions) ? null : i.Instructions.Trim(),
        CreatedAt = DateTime.UtcNow,
        IsActive = true
    };

    private async Task<string> GeneratePrescriptionNumberAsync()
    {
        var last = await _context.Prescriptions
            .IgnoreQueryFilters()
            .Select(p => p.PrescriptionNumber)
            .OrderByDescending(p => p)
            .FirstOrDefaultAsync();

        var next = 1;
        if (!string.IsNullOrWhiteSpace(last) && last.StartsWith("RX-")
            && int.TryParse(last.AsSpan(3), out var parsed))
        {
            next = parsed + 1;
        }
        return $"RX-{next:D6}";
    }

    private IQueryable<Prescription> BaseQuery() =>
        _context.Prescriptions.AsNoTracking()
            .Include(p => p.Items)
            .Include(p => p.MedicalRecord)
                .ThenInclude(m => m.Appointment)
                    .ThenInclude(a => a.Patient)
            .Include(p => p.MedicalRecord)
                .ThenInclude(m => m.Appointment)
                    .ThenInclude(a => a.Doctor);
}
