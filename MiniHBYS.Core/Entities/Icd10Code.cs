namespace MiniHBYS.Core.Entities;

/// <summary>
/// ICD-10 (Uluslararası Hastalık Sınıflaması, 10. Revizyon) tanı kodu referans tablosu.
/// </summary>
public class Icd10Code
{
    public string Code { get; set; } = string.Empty;
    public string NameTr { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string Category { get; set; } = string.Empty;
}
