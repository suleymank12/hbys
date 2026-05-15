using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class Icd10Service : IIcd10Service
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public Icd10Service(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ApiResponse<IEnumerable<Icd10CodeDto>>> SearchAsync(string? term, int limit = 20)
    {
        var query = _context.Icd10Codes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(term))
        {
            // Hem Code (büyük-küçük duyarsız) hem NameTr içinde ara.
            var t = term.Trim();
            var lower = t.ToLower();
            query = query.Where(c =>
                EF.Functions.ILike(c.Code, $"%{t}%") ||
                EF.Functions.ILike(c.NameTr, $"%{t}%"));
            // Code başında eşleşenler önce gelsin.
            query = query
                .OrderByDescending(c => c.Code.ToLower().StartsWith(lower))
                .ThenBy(c => c.Code);
        }
        else
        {
            query = query.OrderBy(c => c.Code);
        }

        var list = await query.Take(Math.Clamp(limit, 1, 100)).ToListAsync();
        return ApiResponse<IEnumerable<Icd10CodeDto>>.Ok(_mapper.Map<IEnumerable<Icd10CodeDto>>(list));
    }
}
