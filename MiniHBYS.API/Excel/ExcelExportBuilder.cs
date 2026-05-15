using ClosedXML.Excel;

namespace MiniHBYS.API.Excel;

public sealed class ExcelColumn<T>
{
    public string Header { get; }
    public Func<T, object?> Selector { get; }
    public string? Format { get; }

    public ExcelColumn(string header, Func<T, object?> selector, string? format = null)
    {
        Header = header;
        Selector = selector;
        Format = format;
    }
}

public static class ExcelExportBuilder
{
    private const string DateFormat = "dd.MM.yyyy HH:mm";

    public static byte[] BuildSingleSheet<T>(
        string sheetName,
        IEnumerable<ExcelColumn<T>> columns,
        IEnumerable<T> rows,
        string? title = null,
        string? subtitle = null)
    {
        var cols = columns.ToList();
        var data = rows.ToList();

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(sheetName);

        var startRow = 1;

        if (!string.IsNullOrWhiteSpace(title))
        {
            var titleCell = sheet.Cell(1, 1);
            titleCell.Value = title;
            titleCell.Style.Font.Bold = true;
            titleCell.Style.Font.FontSize = 14;
            titleCell.Style.Font.FontColor = XLColor.FromHtml("#1E3A8A");
            sheet.Range(1, 1, 1, cols.Count).Merge();
            startRow++;
        }

        if (!string.IsNullOrWhiteSpace(subtitle))
        {
            var sub = sheet.Cell(startRow, 1);
            sub.Value = subtitle;
            sub.Style.Font.FontSize = 10;
            sub.Style.Font.FontColor = XLColor.FromHtml("#64748B");
            sheet.Range(startRow, 1, startRow, cols.Count).Merge();
            startRow++;
        }

        if (startRow > 1) startRow++; // boş satır

        var headerRow = startRow;
        for (int i = 0; i < cols.Count; i++)
        {
            var c = sheet.Cell(headerRow, i + 1);
            c.Value = cols[i].Header;
        }

        var headerRange = sheet.Range(headerRow, 1, headerRow, cols.Count);
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#1D4ED8");
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        headerRange.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        headerRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
        headerRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
        sheet.Row(headerRow).Height = 22;

        var firstDataRow = headerRow + 1;
        for (int r = 0; r < data.Count; r++)
        {
            var rowIndex = firstDataRow + r;
            var rowItem = data[r];

            for (int c = 0; c < cols.Count; c++)
            {
                var cell = sheet.Cell(rowIndex, c + 1);
                var value = cols[c].Selector(rowItem);
                SetCellValue(cell, value);
                if (!string.IsNullOrEmpty(cols[c].Format))
                {
                    cell.Style.NumberFormat.Format = cols[c].Format;
                }
                else if (value is DateTime)
                {
                    cell.Style.NumberFormat.Format = DateFormat;
                }
            }

            var rng = sheet.Range(rowIndex, 1, rowIndex, cols.Count);
            if (r % 2 == 1)
            {
                rng.Style.Fill.BackgroundColor = XLColor.FromHtml("#EFF6FF");
            }
            rng.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            rng.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            rng.Style.Border.OutsideBorderColor = XLColor.FromHtml("#E2E8F0");
            rng.Style.Border.InsideBorderColor = XLColor.FromHtml("#E2E8F0");
            rng.Style.Alignment.Vertical = XLAlignmentVerticalValues.Center;
        }

        if (data.Count == 0)
        {
            var empty = sheet.Cell(firstDataRow, 1);
            empty.Value = "Bu kriterlere uyan kayıt bulunamadı.";
            empty.Style.Font.Italic = true;
            empty.Style.Font.FontColor = XLColor.FromHtml("#64748B");
            empty.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            sheet.Range(firstDataRow, 1, firstDataRow, cols.Count).Merge();
        }

        sheet.SheetView.FreezeRows(headerRow);
        sheet.Columns().AdjustToContents();
        foreach (var col in sheet.Columns(1, cols.Count))
        {
            if (col.Width < 14) col.Width = 14;
            if (col.Width > 60) col.Width = 60;
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void SetCellValue(IXLCell cell, object? value)
    {
        switch (value)
        {
            case null:
                cell.Value = string.Empty;
                break;
            case DateTime dt:
                cell.Value = dt;
                break;
            case bool b:
                cell.Value = b ? "Evet" : "Hayır";
                break;
            case int i:
                cell.Value = i;
                break;
            case long l:
                cell.Value = l;
                break;
            case double d:
                cell.Value = d;
                break;
            case decimal m:
                cell.Value = m;
                break;
            default:
                cell.Value = value.ToString();
                break;
        }
    }
}
