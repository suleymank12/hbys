using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MiniHBYS.Business.Pdf;

public class EpikrizPrescriptionItem
{
    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }
}

public class EpikrizVitalSigns
{
    public int? BloodPressureSystolic { get; set; }
    public int? BloodPressureDiastolic { get; set; }
    public int? Pulse { get; set; }
    public decimal? Temperature { get; set; }
    public int? RespiratoryRate { get; set; }
    public int? OxygenSaturation { get; set; }
    public decimal? Height { get; set; }
    public decimal? Weight { get; set; }

    public bool HasAny =>
        BloodPressureSystolic.HasValue || BloodPressureDiastolic.HasValue ||
        Pulse.HasValue || Temperature.HasValue ||
        RespiratoryRate.HasValue || OxygenSaturation.HasValue ||
        Height.HasValue || Weight.HasValue;
}

public class EpikrizData
{
    public string HastaneAdi { get; set; } = "Mini HBYS";
    public string PatientFullName { get; set; } = string.Empty;
    public string ProtocolNumber { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string? BloodType { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorBranch { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public string ChiefComplaint { get; set; } = string.Empty;
    public string? History { get; set; }
    public string? Examination { get; set; }
    public string Diagnosis { get; set; } = string.Empty;
    public string? DiagnosisCode { get; set; }
    public string? TreatmentPlan { get; set; }
    public string? Notes { get; set; }
    public EpikrizVitalSigns? VitalSigns { get; set; }
    public string? PrescriptionNumber { get; set; }
    public List<EpikrizPrescriptionItem> PrescriptionItems { get; set; } = new();
}

public static class EpikrizPdfBuilder
{
    private const string PrimaryHex = "#1D4ED8";
    private const string SubtleHex = "#64748B";
    private const string BorderHex = "#CBD5E1";
    private const string SoftBgHex = "#F1F5F9";
    private const string AccentHex = "#1E3A8A";

    public static byte[] Generate(EpikrizData data)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(36);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(t => t.FontSize(10).FontColor(Colors.Black));

                page.Header().Element(c => ComposeHeader(c, data));
                page.Content().PaddingVertical(10).Element(c => ComposeContent(c, data));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, EpikrizData data)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text(data.HastaneAdi)
                        .FontSize(16).Bold().FontColor(AccentHex);
                    c.Item().Text("Epikriz Raporu")
                        .FontSize(12).FontColor(SubtleHex);
                });
                row.ConstantItem(160).AlignRight().Column(c =>
                {
                    c.Item().AlignRight().Text(
                            $"Düzenlenme: {DateTime.Now:dd.MM.yyyy HH:mm}")
                        .FontSize(9).FontColor(SubtleHex);
                    c.Item().AlignRight().Text(
                            $"Protokol: {data.ProtocolNumber}")
                        .FontSize(9).FontColor(SubtleHex);
                });
            });
            col.Item().PaddingTop(6).LineHorizontal(1.2f).LineColor(PrimaryHex);
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().LineHorizontal(0.5f).LineColor(BorderHex);
            col.Item().PaddingTop(4).Row(row =>
            {
                row.RelativeItem().Text(
                        "Bu belge Mini HBYS tarafından otomatik olarak oluşturulmuştur.")
                    .FontSize(8).FontColor(SubtleHex);
                row.ConstantItem(120).AlignRight().Text(text =>
                {
                    text.DefaultTextStyle(s => s.FontSize(8).FontColor(SubtleHex));
                    text.Span("Sayfa ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });
    }

    private static void ComposeContent(IContainer container, EpikrizData data)
    {
        container.Column(col =>
        {
            col.Spacing(10);

            // İki sütunlu üst bilgi (Hasta + Doktor/Muayene)
            col.Item().Row(row =>
            {
                row.RelativeItem().Element(c => InfoCard(c, "HASTA BİLGİLERİ", new[]
                {
                    ("Ad Soyad",      data.PatientFullName),
                    ("Protokol No",   data.ProtocolNumber),
                    ("TC Kimlik",     data.NationalId),
                    ("Doğum Tarihi",  data.BirthDate.ToString("dd.MM.yyyy")),
                    ("Cinsiyet",      data.Gender),
                    ("Kan Grubu",     data.BloodType ?? "—"),
                }));
                row.ConstantItem(12);
                row.RelativeItem().Element(c => InfoCard(c, "DOKTOR & MUAYENE", new[]
                {
                    ("Doktor",         data.DoctorName),
                    ("Branş",          data.DoctorBranch),
                    ("Muayene Tarihi", data.AppointmentDate.ToString("dd.MM.yyyy")),
                    ("Saat",           data.AppointmentDate.ToString("HH:mm")),
                }));
            });

            if (data.VitalSigns?.HasAny == true)
            {
                col.Item().Element(c => SectionTitle(c, "VİTAL BULGULAR"));
                col.Item().Element(c => VitalsTable(c, data.VitalSigns));
            }

            col.Item().Element(c => SoapSection(c, "BAŞVURU ŞİKAYETİ", data.ChiefComplaint));

            if (!string.IsNullOrWhiteSpace(data.History))
                col.Item().Element(c => SoapSection(c, "ANAMNEZ", data.History!));

            if (!string.IsNullOrWhiteSpace(data.Examination))
                col.Item().Element(c => SoapSection(c, "FİZİK MUAYENE", data.Examination!));

            col.Item().Element(c => DiagnosisSection(c, data.Diagnosis, data.DiagnosisCode));

            if (!string.IsNullOrWhiteSpace(data.TreatmentPlan))
                col.Item().Element(c => SoapSection(c, "TEDAVİ PLANI", data.TreatmentPlan!));

            if (!string.IsNullOrWhiteSpace(data.Notes))
                col.Item().Element(c => SoapSection(c, "NOTLAR", data.Notes!));

            if (data.PrescriptionItems.Count > 0)
            {
                col.Item().Element(c =>
                    SectionTitle(c, $"REÇETE{(string.IsNullOrWhiteSpace(data.PrescriptionNumber) ? "" : $" — {data.PrescriptionNumber}")}"));
                col.Item().Element(c => PrescriptionTable(c, data.PrescriptionItems));
            }

            col.Item().PaddingTop(20).Row(row =>
            {
                row.RelativeItem();
                row.ConstantItem(220).Column(c =>
                {
                    c.Item().LineHorizontal(0.7f).LineColor(Colors.Black);
                    c.Item().PaddingTop(4).AlignCenter().Text(data.DoctorName)
                        .FontSize(10).Bold();
                    c.Item().AlignCenter().Text(data.DoctorBranch)
                        .FontSize(9).FontColor(SubtleHex);
                });
            });
        });
    }

    private static void InfoCard(IContainer container, string title, (string Label, string Value)[] rows)
    {
        container.Border(0.5f).BorderColor(BorderHex)
            .Background(SoftBgHex)
            .Padding(10).Column(col =>
            {
                col.Item().PaddingBottom(4).Text(title)
                    .FontSize(9).Bold().FontColor(AccentHex);
                foreach (var (label, value) in rows)
                {
                    col.Item().Row(r =>
                    {
                        r.ConstantItem(90).Text(label).FontSize(9).FontColor(SubtleHex);
                        r.RelativeItem().Text(string.IsNullOrWhiteSpace(value) ? "—" : value)
                            .FontSize(10);
                    });
                }
            });
    }

    private static void SectionTitle(IContainer container, string title)
    {
        container.PaddingTop(4).Column(col =>
        {
            col.Item().Text(title).FontSize(10).Bold().FontColor(AccentHex);
            col.Item().PaddingTop(2).LineHorizontal(0.6f).LineColor(PrimaryHex);
        });
    }

    private static void SoapSection(IContainer container, string title, string body)
    {
        container.Column(col =>
        {
            SectionTitle(col.Item(), title);
            col.Item().PaddingTop(4).Text(body).FontSize(10);
        });
    }

    private static void DiagnosisSection(IContainer container, string diagnosis, string? code)
    {
        container.Column(col =>
        {
            SectionTitle(col.Item(), "TANI");
            col.Item().PaddingTop(4).Row(row =>
            {
                if (!string.IsNullOrWhiteSpace(code))
                {
                    row.AutoItem()
                        .PaddingRight(6)
                        .Background("#DBEAFE")
                        .Border(0.5f).BorderColor("#93C5FD")
                        .PaddingVertical(2).PaddingHorizontal(6)
                        .Text(code!).FontSize(9).Bold().FontColor(AccentHex);
                    row.ConstantItem(6);
                }
                row.RelativeItem().Text(diagnosis).FontSize(10).Bold();
            });
        });
    }

    private static void VitalsTable(IContainer container, EpikrizVitalSigns v)
    {
        var rows = new List<(string Label, string Value)>();

        if (v.BloodPressureSystolic.HasValue && v.BloodPressureDiastolic.HasValue)
            rows.Add(("Tansiyon", $"{v.BloodPressureSystolic}/{v.BloodPressureDiastolic} mmHg"));
        if (v.Pulse.HasValue)
            rows.Add(("Nabız", $"{v.Pulse} /dk"));
        if (v.Temperature.HasValue)
            rows.Add(("Ateş", $"{v.Temperature:0.0} °C"));
        if (v.OxygenSaturation.HasValue)
            rows.Add(("SpO₂", $"%{v.OxygenSaturation}"));
        if (v.RespiratoryRate.HasValue)
            rows.Add(("Solunum", $"{v.RespiratoryRate} /dk"));
        if (v.Height.HasValue)
            rows.Add(("Boy", $"{v.Height:0.#} cm"));
        if (v.Weight.HasValue)
            rows.Add(("Kilo", $"{v.Weight:0.#} kg"));

        container.PaddingTop(4).Table(table =>
        {
            table.ColumnsDefinition(cd =>
            {
                cd.RelativeColumn(1);
                cd.RelativeColumn(2);
                cd.RelativeColumn(1);
                cd.RelativeColumn(2);
            });

            for (int i = 0; i < rows.Count; i += 2)
            {
                table.Cell().Border(0.4f).BorderColor(BorderHex).Background(SoftBgHex)
                    .PaddingVertical(3).PaddingHorizontal(6)
                    .Text(rows[i].Label).FontSize(9).FontColor(SubtleHex);
                table.Cell().Border(0.4f).BorderColor(BorderHex)
                    .PaddingVertical(3).PaddingHorizontal(6)
                    .Text(rows[i].Value).FontSize(10);

                if (i + 1 < rows.Count)
                {
                    table.Cell().Border(0.4f).BorderColor(BorderHex).Background(SoftBgHex)
                        .PaddingVertical(3).PaddingHorizontal(6)
                        .Text(rows[i + 1].Label).FontSize(9).FontColor(SubtleHex);
                    table.Cell().Border(0.4f).BorderColor(BorderHex)
                        .PaddingVertical(3).PaddingHorizontal(6)
                        .Text(rows[i + 1].Value).FontSize(10);
                }
                else
                {
                    table.Cell().Border(0.4f).BorderColor(BorderHex).Background(SoftBgHex);
                    table.Cell().Border(0.4f).BorderColor(BorderHex);
                }
            }
        });
    }

    private static void PrescriptionTable(IContainer container, List<EpikrizPrescriptionItem> items)
    {
        container.PaddingTop(4).Table(table =>
        {
            table.ColumnsDefinition(cd =>
            {
                cd.RelativeColumn(3); // İlaç
                cd.RelativeColumn(1.2f); // Doz
                cd.RelativeColumn(1.8f); // Sıklık
                cd.RelativeColumn(1.2f); // Süre
                cd.RelativeColumn(2.5f); // Talimat
            });

            table.Header(header =>
            {
                void H(string s) => header.Cell()
                    .Background(PrimaryHex).PaddingVertical(4).PaddingHorizontal(6)
                    .Text(s).FontSize(9).Bold().FontColor(Colors.White);

                H("İlaç");
                H("Doz");
                H("Sıklık");
                H("Süre");
                H("Talimat");
            });

            for (int i = 0; i < items.Count; i++)
            {
                var it = items[i];
                var bg = i % 2 == 0 ? (string)Colors.White : SoftBgHex;

                void C(string? s) => table.Cell().Background(bg).Border(0.3f).BorderColor(BorderHex)
                    .PaddingVertical(3).PaddingHorizontal(6)
                    .Text(string.IsNullOrWhiteSpace(s) ? "—" : s).FontSize(9);

                C(it.MedicationName);
                C(it.Dosage);
                C(it.Frequency);
                C(it.Duration);
                C(it.Instructions);
            }
        });
    }
}
