using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class DoctorService : IDoctorService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public DoctorService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApiResponse<IEnumerable<DoctorDto>>> GetAllAsync()
    {
        var list = await _context.Doctors.AsNoTracking().OrderBy(d => d.Branch).ThenBy(d => d.Name).ToListAsync();
        return ApiResponse<IEnumerable<DoctorDto>>.Ok(_mapper.Map<IEnumerable<DoctorDto>>(list));
    }

    public async Task<ApiResponse<DoctorDto>> GetByIdAsync(int id)
    {
        var entity = await _context.Doctors.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        return entity is null
            ? ApiResponse<DoctorDto>.Fail("Doktor bulunamadı.")
            : ApiResponse<DoctorDto>.Ok(_mapper.Map<DoctorDto>(entity));
    }

    public async Task<ApiResponse<IEnumerable<DoctorDto>>> GetByBranchAsync(string branch)
    {
        var list = await _context.Doctors.AsNoTracking()
            .Where(d => d.Branch == branch)
            .OrderBy(d => d.Name)
            .ToListAsync();
        return ApiResponse<IEnumerable<DoctorDto>>.Ok(_mapper.Map<IEnumerable<DoctorDto>>(list));
    }

    public async Task<ApiResponse<DoctorDto>> CreateAsync(CreateDoctorDto dto)
    {
        if (await _context.Doctors.AnyAsync(d => d.Email == dto.Email))
            return ApiResponse<DoctorDto>.Fail("Bu e-posta adresi ile kayıtlı bir doktor zaten mevcut.");

        var entity = _mapper.Map<Doctor>(dto);
        entity.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        entity.CreatedAt = DateTime.UtcNow;
        entity.IsActive = true;

        _context.Doctors.Add(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<DoctorDto>.Ok(_mapper.Map<DoctorDto>(entity), "Doktor başarıyla oluşturuldu.");
    }

    public async Task<ApiResponse<DoctorDto>> UpdateAsync(int id, UpdateDoctorDto dto)
    {
        var entity = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == id);
        if (entity is null) return ApiResponse<DoctorDto>.Fail("Doktor bulunamadı.");

        if (entity.Email != dto.Email &&
            await _context.Doctors.AnyAsync(d => d.Email == dto.Email && d.Id != id))
            return ApiResponse<DoctorDto>.Fail("Bu e-posta adresi başka bir doktor tarafından kullanılıyor.");

        entity.Name = dto.Name;
        entity.Branch = dto.Branch;
        entity.Email = dto.Email;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ApiResponse<DoctorDto>.Ok(_mapper.Map<DoctorDto>(entity), "Doktor bilgileri güncellendi.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var entity = await _context.Doctors.FirstOrDefaultAsync(d => d.Id == id);
        if (entity is null) return ApiResponse<bool>.Fail("Doktor bulunamadı.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Doktor kaydı silindi.");
    }
}
