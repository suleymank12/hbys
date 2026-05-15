using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Entities;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _accessor;
    private readonly IMapper _mapper;

    public AuditService(AppDbContext context, IHttpContextAccessor accessor, IMapper mapper)
    {
        _context = context;
        _accessor = accessor;
        _mapper = mapper;
    }

    public async Task LogAsync(string entityType, int entityId, string action, string? details = null)
    {
        var http = _accessor.HttpContext;
        if (http is null) return;

        var sub = http.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? http.User.FindFirstValue(ClaimTypes.NameIdentifier);
        int.TryParse(sub, out var userId);

        var name = http.User.FindFirstValue(ClaimTypes.Name)
                   ?? http.User.FindFirstValue("name")
                   ?? "Bilinmiyor";

        var role = http.User.FindFirstValue(ClaimTypes.Role)
                   ?? http.User.FindFirstValue("role")
                   ?? "Bilinmiyor";

        var ip = http.Connection.RemoteIpAddress?.ToString();

        await LogForAsync(userId, name, role, entityType, entityId, action, details, ip);
    }

    public async Task LogForAsync(
        int userId,
        string userName,
        string userRole,
        string entityType,
        int entityId,
        string action,
        string? details = null,
        string? ipAddress = null)
    {
        // Per-request HttpContext'in IP'sini fallback olarak kullan.
        if (string.IsNullOrEmpty(ipAddress))
            ipAddress = _accessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

        var log = new AuditLog
        {
            UserId = userId,
            UserName = Truncate(userName, 200),
            UserRole = Truncate(userRole, 50),
            EntityType = Truncate(entityType, 100),
            EntityId = entityId,
            Action = Truncate(action, 50),
            Details = details is null ? null : Truncate(details, 2000),
            IpAddress = ipAddress is null ? null : Truncate(ipAddress, 64),
            Timestamp = DateTime.UtcNow
        };
        _context.AuditLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<ApiResponse<IEnumerable<AuditLogDto>>> GetByEntityAsync(string entityType, int entityId)
    {
        var list = await _context.AuditLogs.AsNoTracking()
            .Where(a => a.EntityType == entityType && a.EntityId == entityId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();
        return ApiResponse<IEnumerable<AuditLogDto>>.Ok(_mapper.Map<IEnumerable<AuditLogDto>>(list));
    }

    public async Task<ApiResponse<IEnumerable<AuditLogDto>>> GetByUserAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        var query = _context.AuditLogs.AsNoTracking().Where(a => a.UserId == userId);
        if (from.HasValue) query = query.Where(a => a.Timestamp >= from.Value);
        if (to.HasValue) query = query.Where(a => a.Timestamp <= to.Value);

        var list = await query.OrderByDescending(a => a.Timestamp).ToListAsync();
        return ApiResponse<IEnumerable<AuditLogDto>>.Ok(_mapper.Map<IEnumerable<AuditLogDto>>(list));
    }

    public async Task<ApiResponse<IEnumerable<AuditLogDto>>> GetRecentAsync(int limit = 50)
    {
        var clamped = Math.Clamp(limit, 1, 500);
        var list = await _context.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.Timestamp)
            .Take(clamped)
            .ToListAsync();
        return ApiResponse<IEnumerable<AuditLogDto>>.Ok(_mapper.Map<IEnumerable<AuditLogDto>>(list));
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max];
}
