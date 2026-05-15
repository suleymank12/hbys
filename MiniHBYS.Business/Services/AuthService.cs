using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MiniHBYS.Core.DTOs;
using MiniHBYS.Core.Enums;
using MiniHBYS.Core.Interfaces;
using MiniHBYS.DataAccess.Context;

namespace MiniHBYS.Business.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IAuditService _audit;
    private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _accessor;

    public AuthService(
        AppDbContext context,
        IConfiguration config,
        IAuditService audit,
        Microsoft.AspNetCore.Http.IHttpContextAccessor accessor)
    {
        _context = context;
        _config = config;
        _audit = audit;
        _accessor = accessor;
    }

    public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return ApiResponse<LoginResponseDto>.Fail("E-posta ve şifre zorunludur.");

        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Doctor)
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
        {
            await _audit.LogForAsync(
                userId: user?.Id ?? 0,
                userName: user?.Name ?? "Bilinmiyor",
                userRole: user?.Role.ToString() ?? "Bilinmiyor",
                entityType: "User",
                entityId: user?.Id ?? 0,
                action: "LoginFailed",
                details: System.Text.Json.JsonSerializer.Serialize(new
                {
                    email = dto.Email,
                    reason = user is null ? "Kullanıcı bulunamadı" : "Şifre hatalı"
                }),
                ipAddress: _accessor.HttpContext?.Connection.RemoteIpAddress?.ToString());
            return ApiResponse<LoginResponseDto>.Fail("E-posta veya şifre hatalı.");
        }

        var doctorId = user.Role == UserRole.Doktor ? user.Doctor?.Id : null;

        var expireMinutes = int.Parse(_config["Jwt:ExpireMinutes"] ?? "480");
        var expiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);
        var token = GenerateJwtToken(user.Id, user.Email, user.Name, user.Role, doctorId, expiresAt);

        await _audit.LogForAsync(
            userId: user.Id,
            userName: user.Name,
            userRole: user.Role.ToString(),
            entityType: "User",
            entityId: user.Id,
            action: "Login",
            details: null,
            ipAddress: _accessor.HttpContext?.Connection.RemoteIpAddress?.ToString());

        return ApiResponse<LoginResponseDto>.Ok(new LoginResponseDto
        {
            Id = user.Id,
            Token = token,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role,
            RoleText = GetRoleText(user.Role),
            DoctorId = doctorId,
            ExpiresAt = expiresAt
        }, "Giriş başarılı.");
    }

    public async Task<ApiResponse<CurrentUserDto>> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Doctor)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return ApiResponse<CurrentUserDto>.Fail("Kullanıcı bulunamadı.");

        var doctorId = user.Role == UserRole.Doktor ? user.Doctor?.Id : null;

        return ApiResponse<CurrentUserDto>.Ok(new CurrentUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role,
            RoleText = GetRoleText(user.Role),
            DoctorId = doctorId
        });
    }

    private string GenerateJwtToken(
        int userId,
        string email,
        string name,
        UserRole role,
        int? doctorId,
        DateTime expiresAt)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key yapılandırılmamış.");
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new("name", name),
            new(ClaimTypes.Name, name),
            new(ClaimTypes.Role, role.ToString()),
            new("role", role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (doctorId.HasValue)
            claims.Add(new Claim("doctorId", doctorId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GetRoleText(UserRole role) => role switch
    {
        UserRole.Admin => "Yönetici",
        UserRole.Doktor => "Doktor",
        UserRole.Sekreter => "Sekreter",
        _ => role.ToString()
    };
}
