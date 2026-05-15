using MiniHBYS.Core.Enums;

namespace MiniHBYS.Core.DTOs;

public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string RoleText { get; set; } = string.Empty;
    public int? DoctorId { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class CurrentUserDto
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string RoleText { get; set; } = string.Empty;
    public int? DoctorId { get; set; }
}
