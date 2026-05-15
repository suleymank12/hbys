using MiniHBYS.Core.Enums;

namespace MiniHBYS.Core.Entities;

public class Patient : BaseEntity
{
    public string ProtocolNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
    public Gender Gender { get; set; } = Gender.Belirtilmemiş;
    public BloodType? BloodType { get; set; }
    public InsuranceType InsuranceType { get; set; } = InsuranceType.SGK;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Address { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Allergies { get; set; }
    public string? ChronicDiseases { get; set; }

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}
