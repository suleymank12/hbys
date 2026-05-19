import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Eye,
  FileText,
  Pencil,
  Search,
  Stethoscope,
  Tag,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { medicalRecordService } from "../../services/medicalRecordService";
import {
  AppointmentStatus,
  AppointmentType,
  type Appointment,
  type MedicalRecord,
} from "../../types";
import { MedicalRecordModal } from "../appointments/MedicalRecordModal";
import { useAuth } from "../../contexts/AuthContext";
import { ExportButton } from "../../components/ui/ExportButton";
import { exportService } from "../../services/exportService";

const DIAGNOSIS_MAX = 60;
const COMPLAINT_MAX = 40;
const PAGE_SIZE = 20;

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

const formatDateGroup = (date: Date): string => {
  if (isToday(date)) return "Bugün";
  if (isYesterday(date)) return "Dün";
  return format(date, "d MMMM yyyy, EEEE", { locale: tr });
};

const recordToAppointment = (r: MedicalRecord): Appointment => ({
  id: r.appointmentId,
  patientId: 0,
  doctorId: 0,
  patientFullName: r.patientFullName,
  doctorName: r.doctorName,
  doctorBranch: r.doctorBranch,
  dateTime: r.appointmentDate,
  status: AppointmentStatus.Tamamlandi,
  statusText: "Tamamlandı",
  type: AppointmentType.Poliklinik,
  typeText: "Poliklinik",
  createdAt: r.createdAt,
});

export function MedicalRecordsPage() {
  const { user, hasRole } = useAuth();
  const isDoctor = hasRole("Doktor");

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [modalTarget, setModalTarget] = useState<Appointment | null>(null);
  const [modalReadonly, setModalReadonly] = useState(false);

  const openView = (r: MedicalRecord) => {
    setModalReadonly(true);
    setModalTarget(recordToAppointment(r));
  };

  const openEdit = (r: MedicalRecord) => {
    setModalReadonly(false);
    setModalTarget(recordToAppointment(r));
  };

  const load = async (currentPage = page) => {
    setLoading(true);
    try {
      if (isDoctor && user?.doctorId) {
        // Doctor scope is naturally bounded.
        const data = await medicalRecordService.getByDoctor(user.doctorId);
        setRecords(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        const result = await medicalRecordService.getAll({
          page: currentPage,
          pageSize: PAGE_SIZE,
        });
        setRecords(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
      }
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDoctor, user?.doctorId]);

  useEffect(() => {
    if (isDoctor && user?.doctorId) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    if (!q) return records;
    return records.filter(
      (r) =>
        r.patientFullName.toLocaleLowerCase("tr-TR").includes(q) ||
        r.doctorName.toLocaleLowerCase("tr-TR").includes(q) ||
        r.diagnosis.toLocaleLowerCase("tr-TR").includes(q)
    );
  }, [records, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, MedicalRecord[]>();
    filtered.forEach((r) => {
      const key = format(new Date(r.appointmentDate), "yyyy-MM-dd");
      const arr = map.get(key);
      if (arr) arr.push(r);
      else map.set(key, [r]);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a > b ? -1 : a < b ? 1 : 0))
      .map(([key, items]) => ({
        key,
        date: new Date(items[0].appointmentDate),
        items,
      }));
  }, [filtered]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Hasta, doktor veya tanı ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white
                       focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
                       transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDoctor && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-medical-50 text-medical-700">
              Sadece kendi muayene kayıtlarınız
            </span>
          )}
          <ExportButton onExport={() => exportService.medicalRecords()} />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-50
                          border border-medical-100 text-medical-700 text-xs font-medium">
            <FileText className="w-3.5 h-3.5" />
            Toplam {totalCount} kayıt
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-medium w-20">Saat</th>
                <th className="text-left px-5 py-3 font-medium">Hasta</th>
                <th className="text-left px-5 py-3 font-medium">Doktor</th>
                <th className="text-left px-5 py-3 font-medium">Tanı</th>
                <th className="text-left px-5 py-3 font-medium">Şikayet</th>
                <th className="text-right px-5 py-3 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 w-full max-w-[160px] bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                    <Stethoscope className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    {search
                      ? "Aramayla eşleşen muayene kaydı bulunamadı."
                      : isDoctor
                      ? "Size ait muayene kaydı bulunmuyor."
                      : "Henüz muayene kaydı bulunmuyor."}
                  </td>
                </tr>
              ) : (
                grouped.flatMap((group) => [
                  <tr key={`g-${group.key}`} className="bg-medical-50/50">
                    <td colSpan={6} className="px-5 py-2.5 border-y border-medical-100">
                      <div className="flex items-center gap-2 text-xs font-semibold text-medical-800 uppercase tracking-wide">
                        <CalendarDays className="w-3.5 h-3.5 text-medical-600" />
                        <span>{formatDateGroup(group.date)}</span>
                        <span className="text-medical-600/70 normal-case font-normal tracking-normal">
                          · {group.items.length} kayıt
                        </span>
                      </div>
                    </td>
                  </tr>,
                  ...group.items.map((r) => {
                    const dt = new Date(r.appointmentDate);
                    const complaint = r.chiefComplaint?.trim() ?? "";
                    const complaintOverflow = complaint.length > COMPLAINT_MAX;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium text-slate-900 tabular-nums">
                            {format(dt, "HH:mm")}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          {r.patientFullName}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-slate-700">{r.doctorName}</div>
                          <div className="text-xs text-slate-500">{r.doctorBranch}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 max-w-[360px]">
                          <div className="flex items-start gap-1.5">
                            {r.diagnosisCode && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-medical-100 text-medical-800 shrink-0 mt-0.5">
                                <Tag className="w-2.5 h-2.5" />
                                {r.diagnosisCode}
                              </span>
                            )}
                            <span title={r.diagnosis.length > DIAGNOSIS_MAX ? r.diagnosis : undefined}>
                              {truncate(r.diagnosis, DIAGNOSIS_MAX)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 max-w-[280px]">
                          {complaint ? (
                            <span className="group relative inline-block align-middle">
                              <span className="cursor-help">
                                {truncate(complaint, COMPLAINT_MAX)}
                              </span>
                              {complaintOverflow && (
                                <span
                                  role="tooltip"
                                  className="pointer-events-none absolute left-0 top-full mt-1.5 z-20
                                             w-72 max-w-[20rem] px-3 py-2 rounded-md
                                             bg-slate-900 text-white text-xs leading-relaxed shadow-lg
                                             opacity-0 group-hover:opacity-100
                                             transition-opacity duration-150
                                             whitespace-pre-wrap break-words"
                                >
                                  {complaint}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-medical-700 hover:bg-medical-50"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() => openView(r)}
                            >
                              Görüntüle
                            </Button>
                            {isDoctor && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Pencil className="w-3.5 h-3.5" />}
                                onClick={() => openEdit(r)}
                              >
                                Düzenle
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }),
                ])
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalCount > 0 && (
          isDoctor ? (
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
              Toplam {filtered.length} muayene kaydı
            </div>
          ) : (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              itemLabel="muayene kaydı"
            />
          )
        )}
      </div>

      <MedicalRecordModal
        open={!!modalTarget}
        appointment={modalTarget}
        readonly={modalReadonly}
        onClose={() => setModalTarget(null)}
        onSaved={() => load()}
      />
    </div>
  );
}
