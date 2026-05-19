using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Enums;
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
        var list = await _context.Doctors.AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Schedules)
            .OrderBy(d => d.Branch).ThenBy(d => d.Name)
            .ToListAsync();
        return ApiResponse<IEnumerable<DoctorDto>>.Ok(_mapper.Map<IEnumerable<DoctorDto>>(list));
    }

    public async Task<ApiResponse<DoctorDto>> GetByIdAsync(int id)
    {
        var entity = await _context.Doctors.AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Schedules)
            .FirstOrDefaultAsync(d => d.Id == id);
        return entity is null
            ? ApiResponse<DoctorDto>.Fail("Doktor bulunamadı.")
            : ApiResponse<DoctorDto>.Ok(_mapper.Map<DoctorDto>(entity));
    }

    public async Task<ApiResponse<IEnumerable<DoctorDto>>> GetByBranchAsync(string branch)
    {
        var list = await _context.Doctors.AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Schedules)
            .Where(d => d.Branch == branch)
            .OrderBy(d => d.Name)
            .ToListAsync();
        return ApiResponse<IEnumerable<DoctorDto>>.Ok(_mapper.Map<IEnumerable<DoctorDto>>(list));
    }

    public async Task<ApiResponse<DoctorDto>> CreateAsync(CreateDoctorDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            return ApiResponse<DoctorDto>.Fail("Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.");

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = UserRole.Doktor,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var entity = new Doctor
        {
            Title = string.IsNullOrWhiteSpace(dto.Title) ? null : dto.Title.Trim(),
            Name = dto.Name,
            Branch = dto.Branch,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _context.Doctors.Add(entity);
        await _context.SaveChangesAsync();

        entity.User = user;
        return ApiResponse<DoctorDto>.Ok(_mapper.Map<DoctorDto>(entity), "Doktor başarıyla oluşturuldu.");
    }

    public async Task<ApiResponse<DoctorDto>> UpdateAsync(int id, UpdateDoctorDto dto)
    {
        var entity = await _context.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id);
        if (entity is null) return ApiResponse<DoctorDto>.Fail("Doktor bulunamadı.");

        if (entity.User.Email != dto.Email &&
            await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != entity.UserId))
            return ApiResponse<DoctorDto>.Fail("Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.");

        entity.Title = string.IsNullOrWhiteSpace(dto.Title) ? null : dto.Title.Trim();
        entity.Name = dto.Name;
        entity.Branch = dto.Branch;
        entity.UpdatedAt = DateTime.UtcNow;

        entity.User.Name = dto.Name;
        entity.User.Email = dto.Email;
        entity.User.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ApiResponse<DoctorDto>.Ok(_mapper.Map<DoctorDto>(entity), "Doktor bilgileri güncellendi.");
    }

    public async Task<ApiResponse<DoctorDto>> UpdateScheduleAsync(int id, UpdateDoctorScheduleDto dto)
    {
        var entity = await _context.Doctors
            .Include(d => d.User)
            .Include(d => d.Schedules)
            .FirstOrDefaultAsync(d => d.Id == id);
        if (entity is null) return ApiResponse<DoctorDto>.Fail("Doktor bulunamadı.");

        var validated = new List<(int Day, TimeSpan Start, TimeSpan End)>();
        var seenDays = new HashSet<int>();

        foreach (var item in dto.Schedules)
        {
            if (item.DayOfWeek < 1 || item.DayOfWeek > 7)
                return ApiResponse<DoctorDto>.Fail($"Geçersiz gün: {item.DayOfWeek}.");

            if (!seenDays.Add(item.DayOfWeek))
                return ApiResponse<DoctorDto>.Fail("Aynı gün için birden fazla mesai kaydı verilemez.");

            if (!TimeSpan.TryParse(item.StartTime, out var start) ||
                !TimeSpan.TryParse(item.EndTime, out var end))
                return ApiResponse<DoctorDto>.Fail("Mesai saatleri HH:mm biçiminde olmalıdır.");

            if (start >= end)
                return ApiResponse<DoctorDto>.Fail($"{GetDayName(item.DayOfWeek)} için başlangıç saati bitiş saatinden önce olmalıdır.");

            validated.Add((item.DayOfWeek, start, end));
        }

        _context.DoctorSchedules.RemoveRange(entity.Schedules);

        foreach (var v in validated)
        {
            _context.DoctorSchedules.Add(new DoctorSchedule
            {
                DoctorId = entity.Id,
                DayOfWeek = v.Day,
                StartTime = v.Start,
                EndTime = v.End,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            });
        }

        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var fresh = await _context.Doctors.AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Schedules)
            .FirstAsync(d => d.Id == id);

        return ApiResponse<DoctorDto>.Ok(_mapper.Map<DoctorDto>(fresh), "Mesai çizelgesi güncellendi.");
    }

    private static string GetDayName(int day) => day switch
    {
        1 => "Pazartesi",
        2 => "Salı",
        3 => "Çarşamba",
        4 => "Perşembe",
        5 => "Cuma",
        6 => "Cumartesi",
        7 => "Pazar",
        _ => day.ToString()
    };

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var entity = await _context.Doctors
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id);
        if (entity is null) return ApiResponse<bool>.Fail("Doktor bulunamadı.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.UtcNow;
        if (entity.User is not null)
        {
            entity.User.IsActive = false;
            entity.User.UpdatedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Doktor kaydı silindi.");
    }
}
