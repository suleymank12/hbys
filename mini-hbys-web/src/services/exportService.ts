import { apiClient } from "./apiClient";

interface DateRange {
  startDate?: string;
  endDate?: string;
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const pad2 = (n: number) => n.toString().padStart(2, "0");
const todayStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
};

const extractFileName = (
  contentDisposition: string | undefined,
  fallback: string
): string => {
  if (!contentDisposition) return fallback;
  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
    } catch {
      /* ignore */
    }
  }
  const match = /filename\s*=\s*"?([^";]+)"?/i.exec(contentDisposition);
  return match?.[1]?.trim() || fallback;
};

const download = async (
  url: string,
  fallbackBase: string,
  params?: Record<string, string | undefined>
) => {
  const cleanParams: Record<string, string> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) cleanParams[k] = v;
    }
  }

  const response = await apiClient.get<Blob>(url, {
    params: cleanParams,
    responseType: "blob",
  });

  const fileName = extractFileName(
    response.headers["content-disposition"] as string | undefined,
    `${fallbackBase}_${todayStamp()}.xlsx`
  );

  downloadBlob(response.data, fileName);
};

const rangeToParams = (range: DateRange): Record<string, string | undefined> => ({
  startDate: range.startDate,
  endDate: range.endDate,
});

export const exportService = {
  patients: () => download("/export/patients", "Hastalar"),
  appointments: (range: DateRange = {}) =>
    download("/export/appointments", "Randevular", rangeToParams(range)),
  medicalRecords: (range: DateRange = {}) =>
    download("/export/medical-records", "Muayene_Kayitlari", rangeToParams(range)),
};
