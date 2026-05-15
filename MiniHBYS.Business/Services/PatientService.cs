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
    private readonly IAuditService _audit;

    public PatientService(AppDbContext context, IMapper mapper, IAuditService audit)
    {
        _context = context;
        _mapper = mapper;
        _audit = audit;
    }

    public async Task<ApiResponse<PagedResult<PatientDto>>> GetAllAsync(int page = 1, int pageSize = 20, string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _context.Patients.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(q) ||
                p.Surname.ToLower().Contains(q) ||
                p.NationalId.Contains(q) ||
                p.ProtocolNumber.ToLower().Contains(q));
        }

        var total = await query.CountAsync();

        var list = await query
            .OrderBy(p => p.Name).ThenBy(p => p.Surname)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var paged = PagedResult<PatientDto>.Create(
            _mapper.Map<List<PatientDto>>(list),
            total, page, pageSize);

        return ApiResponse<PagedResult<PatientDto>>.Ok(paged);
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

        await _audit.LogAsync("Patient", entity.Id, "Create",
            $"Yeni hasta: {entity.ProtocolNumber} - {entity.Name} {entity.Surname}");

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

        await _audit.LogAsync("Patient", entity.Id, "Update",
            $"Hasta güncellendi: {entity.ProtocolNumber}");

        return ApiResponse<PatientDto>.Ok(_mapper.Map<PatientDto>(entity), "Hasta bilgileri güncellendi.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var entity = await _context.Patients.FirstOrDefaultAsync(p => p.Id == id);
        if (entity is null) return ApiResponse<bool>.Fail("Hasta bulunamadı.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _audit.LogAsync("Patient", entity.Id, "Delete",
            $"Hasta pasifleştirildi: {entity.ProtocolNumber}");

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
