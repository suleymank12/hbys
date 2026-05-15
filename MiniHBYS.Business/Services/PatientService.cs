using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class PatientService : IPatientService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public PatientService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApiResponse<IEnumerable<PatientDto>>> GetAllAsync()
    {
        var list = await _context.Patients.AsNoTracking()
            .OrderBy(p => p.Name).ThenBy(p => p.Surname)
            .ToListAsync();
        return ApiResponse<IEnumerable<PatientDto>>.Ok(_mapper.Map<IEnumerable<PatientDto>>(list));
    }

    public async Task<ApiResponse<PatientDto>> GetByIdAsync(int id)
    {
        var entity = await _context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        return entity is null
            ? ApiResponse<PatientDto>.Fail("Hasta bulunamadı.")
            : ApiResponse<PatientDto>.Ok(_mapper.Map<PatientDto>(entity));
    }

    public async Task<ApiResponse<PatientDto>> GetByNationalIdAsync(string nationalId)
    {
        var entity = await _context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.NationalId == nationalId);
        return entity is null
            ? ApiResponse<PatientDto>.Fail("Bu TC kimlik numarası ile kayıtlı hasta bulunamadı.")
            : ApiResponse<PatientDto>.Ok(_mapper.Map<PatientDto>(entity));
    }

    public async Task<ApiResponse<PatientDto>> CreateAsync(CreatePatientDto dto)
    {
        if (await _context.Patients.AnyAsync(p => p.NationalId == dto.NationalId))
            return ApiResponse<PatientDto>.Fail("Bu TC kimlik numarası ile kayıtlı bir hasta zaten mevcut.");

        var entity = _mapper.Map<Patient>(dto);
        entity.BirthDate = DateTime.SpecifyKind(entity.BirthDate, DateTimeKind.Utc);
        entity.ProtocolNumber = await GenerateProtocolNumberAsync();
        entity.CreatedAt = DateTime.UtcNow;
        entity.IsActive = true;

        _context.Patients.Add(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<PatientDto>.Ok(_mapper.Map<PatientDto>(entity), "Hasta başarıyla oluşturuldu.");
    }

    public async Task<ApiResponse<PatientDto>> UpdateAsync(int id, UpdatePatientDto dto)
    {
        var entity = await _context.Patients.FirstOrDefaultAsync(p => p.Id == id);
        if (entity is null) return ApiResponse<PatientDto>.Fail("Hasta bulunamadı.");

        entity.Name = dto.Name;
        entity.Surname = dto.Surname;
        entity.BirthDate = DateTime.SpecifyKind(dto.BirthDate, DateTimeKind.Utc);
        entity.Gender = dto.Gender;
        entity.BloodType = dto.BloodType;
        entity.InsuranceType = dto.InsuranceType;
        entity.Phone = dto.Phone;
        entity.Email = dto.Email;
        entity.City = dto.City;
        entity.District = dto.District;
        entity.Address = dto.Address;
        entity.EmergencyContactName = dto.EmergencyContactName;
        entity.EmergencyContactPhone = dto.EmergencyContactPhone;
        entity.Allergies = dto.Allergies;
        entity.ChronicDiseases = dto.ChronicDiseases;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ApiResponse<PatientDto>.Ok(_mapper.Map<PatientDto>(entity), "Hasta bilgileri güncellendi.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var entity = await _context.Patients.FirstOrDefaultAsync(p => p.Id == id);
        if (entity is null) return ApiResponse<bool>.Fail("Hasta bulunamadı.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Hasta kaydı silindi.");
    }

    private async Task<string> GenerateProtocolNumberAsync()
    {
        // Soft-delete edilmiş kayıtlar da dahil — en yüksek protokol numarası bulunur.
        var last = await _context.Patients
            .IgnoreQueryFilters()
            .Select(p => p.ProtocolNumber)
            .OrderByDescending(p => p)
            .FirstOrDefaultAsync();

        var next = 1;
        if (!string.IsNullOrWhiteSpace(last) && last.StartsWith("P-")
            && int.TryParse(last.AsSpan(2), out var parsed))
        {
            next = parsed + 1;
        }

        return $"P-{next:D6}";
    }
}
