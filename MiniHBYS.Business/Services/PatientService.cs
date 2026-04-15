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
        var list = await _context.Patients.AsNoTracking().OrderBy(p => p.Name).ToListAsync();
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
        entity.Phone = dto.Phone;
        entity.Email = dto.Email;
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
}
