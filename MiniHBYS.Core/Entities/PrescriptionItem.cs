namespace MiniHBYS.Core.Entities;

public class PrescriptionItem : BaseEntity
{
    public int PrescriptionId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }

    public Prescription Prescription { get; set; } = null!;
}
