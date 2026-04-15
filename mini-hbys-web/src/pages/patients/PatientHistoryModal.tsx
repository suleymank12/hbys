import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ClipboardList, FileText, Stethoscope } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { medicalRecordService } from "../../services/medicalRecordService";
import type { MedicalRecord, Patient } from "../../types";

interface Props {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
}

export function PatientHistoryModal({ open, patient, onClose }: Props) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !patient) return;
    setLoading(true);
    medicalRecordService
      .getByPatientId(patient.id)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [open, patient]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hasta Geçmişi"
      description={patient ? `${patient.fullName} — TC: ${patient.nationalId}` : ""}
      size="lg"
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          Bu hastaya ait muayene kaydı bulunmuyor.
        </div>
      ) : (
        <ol className="relative space-y-4 pl-6 max-h-[60vh] overflow-y-auto pr-1">
          <span className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
          {records.map((r) => (
            <TimelineItem key={r.id} record={r} />
          ))}
        </ol>
      )}
    </Modal>
  );
}

function TimelineItem({ record }: { record: MedicalRecord }) {
  const date = new Date(record.appointmentDate);
  return (
    <li className="relative">
      <span className="absolute -left-6 top-2 w-[18px] h-[18px] rounded-full bg-white border-2 border-medical-500 flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-medical-500" />
      </span>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-medical-200 hover:shadow transition-all">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900 tabular-nums">
              {format(date, "dd MMMM yyyy", { locale: tr })}
              <span className="text-slate-400 font-normal ml-2 tabular-nums">
                {format(date, "HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Stethoscope className="w-3.5 h-3.5" />
              {record.doctorName}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
            <FileText className="w-3 h-3" /> Tanı
          </div>
          <p className="text-sm text-slate-800">{record.diagnosis}</p>
        </div>

        {record.notes && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
              Notlar
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.notes}</p>
          </div>
        )}
      </div>
    </li>
  );
}
