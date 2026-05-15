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

    public AuthService(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return ApiResponse<LoginResponseDto>.Fail("E-posta ve şifre zorunludur.");

        var user = await _context.Doctors
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Email == dto.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            return ApiResponse<LoginResponseDto>.Fail("E-posta veya şifre hatalı.");

        var expireMinutes = int.Parse(_config["Jwt:ExpireMinutes"] ?? "480");
        var expiresAt = DateTime.UtcNow.AddMinutes(expireMinutes);
        var token = GenerateJwtToken(user.Id, user.Email, user.Name, user.Role, expiresAt);

        return ApiResponse<LoginResponseDto>.Ok(new LoginResponseDto
        {
            Id = user.Id,
            Token = token,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role,
            RoleText = GetRoleText(user.Role),
            ExpiresAt = expiresAt
        }, "Giriş başarılı.");
    }

    public async Task<ApiResponse<CurrentUserDto>> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Doctors
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == userId);

        if (user is null)
            return ApiResponse<CurrentUserDto>.Fail("Kullanıcı bulunamadı.");

        return ApiResponse<CurrentUserDto>.Ok(new CurrentUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role,
            RoleText = GetRoleText(user.Role)
        });
    }

    private string GenerateJwtToken(int userId, string email, string name, UserRole role, DateTime expiresAt)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key yapılandırılmamış.");
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("name", name),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Role, role.ToString()),
            new Claim("role", role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

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
