namespace MiniHBYS.Core.Entities;

public class Prescription : BaseEntity
{
    public int MedicalRecordId { get; set; }
    public string PrescriptionNumber { get; set; } = string.Empty;
    public DateTime PrescribedAt { get; set; } = DateTime.UtcNow;

    public MedicalRecord MedicalRecord { get; set; } = null!;
    public ICollection<PrescriptionItem> Items { get; set; } = new List<PrescriptionItem>();
}
