namespace MiniHBYS.Core.DTOs;

public class DoctorDto
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<DoctorScheduleDto> Schedules { get; set; } = new();
}

public class CreateDoctorDto
{
    public string? Title { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UpdateDoctorDto
{
    public string? Title { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class DoctorScheduleDto
{
    public int DayOfWeek { get; set; }
    public string DayName { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}

public class UpdateScheduleItemDto
{
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}

public class UpdateDoctorScheduleDto
{
    public List<UpdateScheduleItemDto> Schedules { get; set; } = new();
}
