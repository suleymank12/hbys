import { useEffect, useMemo, useState } from "react";
import { Eye, FileText, Pencil, Search, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "../../components/ui/Button";
import { medicalRecordService } from "../../services/medicalRecordService";
import { AppointmentStatus, type Appointment, type MedicalRecord } from "../../types";
import { MedicalRecordModal } from "../appointments/MedicalRecordModal";

const DIAGNOSIS_MAX = 60;
const NOTES_MAX = 40;

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

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
  createdAt: r.createdAt,
});

export function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  const load = async () => {
    setLoading(true);
    try {
      setRecords(await medicalRecordService.getAll());
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-50
                        border border-medical-100 text-medical-700 text-xs font-medium">
          <FileText className="w-3.5 h-3.5" />
          Toplam {filtered.length} kayıt
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Tarih & Saat</th>
                <th className="text-left px-5 py-3 font-medium">Hasta</th>
                <th className="text-left px-5 py-3 font-medium">Doktor</th>
                <th className="text-left px-5 py-3 font-medium">Tanı</th>
                <th className="text-left px-5 py-3 font-medium">Notlar</th>
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
                      : "Henüz muayene kaydı bulunmuyor."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const dt = new Date(r.appointmentDate);
                  const notes = r.notes?.trim() ?? "";
                  const notesOverflow = notes.length > NOTES_MAX;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 tabular-nums">
                          {format(dt, "dd MMM yyyy", { locale: tr })}
                        </div>
                        <div className="text-xs text-slate-500 tabular-nums">
                          {format(dt, "HH:mm", { locale: tr })}
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
                        <span title={r.diagnosis.length > DIAGNOSIS_MAX ? r.diagnosis : undefined}>
                          {truncate(r.diagnosis, DIAGNOSIS_MAX)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[280px]">
                        {notes ? (
                          <span className="group relative inline-block align-middle">
                            <span className="cursor-help">{truncate(notes, NOTES_MAX)}</span>
                            {notesOverflow && (
                              <span
                                role="tooltip"
                                className="pointer-events-none absolute left-0 top-full mt-1.5 z-20
                                           w-72 max-w-[20rem] px-3 py-2 rounded-md
                                           bg-slate-900 text-white text-xs leading-relaxed shadow-lg
                                           opacity-0 group-hover:opacity-100
                                           transition-opacity duration-150
                                           whitespace-pre-wrap break-words"
                              >
                                {notes}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => openEdit(r)}
                          >
                            Düzenle
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/50">
            Toplam {filtered.length} muayene kaydı
          </div>
        )}
      </div>

      <MedicalRecordModal
        open={!!modalTarget}
        appointment={modalTarget}
        readonly={modalReadonly}
        onClose={() => setModalTarget(null)}
        onSaved={load}
      />
    </div>
  );
}
