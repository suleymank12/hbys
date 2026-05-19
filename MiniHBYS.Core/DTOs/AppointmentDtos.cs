using MiniHBYS.Core.Enums;

namespace MiniHBYS.Core.DTOs;

public class AppointmentDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorBranch { get; set; } = string.Empty;
    public DateTime DateTime { get; set; }
    public AppointmentStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public AppointmentType Type { get; set; }
    public string TypeText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateAppointmentDto
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public DateTime DateTime { get; set; }
    public AppointmentType Type { get; set; } = AppointmentType.Poliklinik;
}

public class UpdateAppointmentStatusDto
{
    public AppointmentStatus Status { get; set; }
}
