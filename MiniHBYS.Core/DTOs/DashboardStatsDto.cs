using MiniHBYS.Core.Enums;

namespace MiniHBYS.Core.DTOs;

public class DashboardStatsDto
{
    public int TotalPatients { get; set; }
    public int TotalDoctors { get; set; }
    public int TodayAppointments { get; set; }
    public int PendingAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public List<BranchStatDto> BranchStats { get; set; } = new();
}

public class BranchStatDto
{
    public string Branch { get; set; } = string.Empty;
    public int DoctorCount { get; set; }
    public int AppointmentCount { get; set; }
}

public class TodayAppointmentDto
{
    public int Id { get; set; }
    public DateTime DateTime { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorBranch { get; set; } = string.Empty;
    public AppointmentStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public AppointmentType Type { get; set; }
    public string TypeText { get; set; } = string.Empty;
}

public class RecentMedicalRecordDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorBranch { get; set; } = string.Empty;
    public string Diagnosis { get; set; } = string.Empty;
    public string? DiagnosisCode { get; set; }
}

public class DoctorStatDto
{
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int PendingAppointments { get; set; }
}
