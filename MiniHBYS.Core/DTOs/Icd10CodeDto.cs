namespace MiniHBYS.Core.DTOs;

public class Icd10CodeDto
{
    public string Code { get; set; } = string.Empty;
    public string NameTr { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string Category { get; set; } = string.Empty;
}
