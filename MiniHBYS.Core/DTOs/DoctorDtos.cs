namespace MiniHBYS.Core.DTOs;

public class DoctorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateDoctorDto
{
    public string Name { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UpdateDoctorDto
{
    public string Name { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
