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
