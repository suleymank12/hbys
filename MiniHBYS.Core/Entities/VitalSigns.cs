namespace MiniHBYS.Core.Entities;

public class VitalSigns : BaseEntity
{
    public int MedicalRecordId { get; set; }

    public int? BloodPressureSystolic { get; set; }
    public int? BloodPressureDiastolic { get; set; }
    public int? Pulse { get; set; }
    public decimal? Temperature { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? OxygenSaturation { get; set; }
    public decimal? Height { get; set; }
    public decimal? Weight { get; set; }

    public MedicalRecord MedicalRecord { get; set; } = null!;
}
