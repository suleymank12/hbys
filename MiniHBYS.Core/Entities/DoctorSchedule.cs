namespace MiniHBYS.Core.Entities;

public class DoctorSchedule : BaseEntity
{
    public int DoctorId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    public Doctor Doctor { get; set; } = null!;
}
