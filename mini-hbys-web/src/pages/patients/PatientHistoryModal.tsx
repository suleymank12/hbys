import { useEffect, useState } from "react";
import { differenceInYears, format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Droplet,
  FileSignature,
  FileText,
  HeartPulse,
  IdCard,
  MapPin,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
  Tag,
  Thermometer,
  User,
  Weight,
  Wind,
} from "lucide-react";
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
      description={patient ? `${patient.protocolNumber} · ${patient.fullName}` : ""}
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto -mx-6 px-6 pb-1">
        {patient && <DemographicsCard patient={patient} />}

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
          <ol className="relative space-y-4 pl-6 pr-1">
            <span className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
            {records.map((r) => (
              <TimelineItem key={r.id} record={r} />
            ))}
          </ol>
        )}
      </div>
    </Modal>
  );
}

function DemographicsCard({ patient }: { patient: Patient }) {
  const age = differenceInYears(new Date(), new Date(patient.birthDate));
  const location = [patient.district, patient.city]
    .filter((x): x is string => !!x && x.trim().length > 0)
    .join(", ");

  return (
    <div className="rounded-xl border border-medical-100 bg-gradient-to-br from-medical-50/70 to-white p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-medical-100/70">
        <div className="w-11 h-11 rounded-lg bg-medical-600 text-white flex items-center justify-center shrink-0">
          <User className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold text-slate-900 truncate">
            {patient.fullName}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-medical-700">{patient.protocolNumber}</span>
            <span className="text-slate-300">·</span>
            <span>{age} yaş</span>
            <span className="text-slate-300">·</span>
            <span>{patient.genderText}</span>
            {patient.bloodTypeText && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                  <Droplet className="w-3 h-3" />
                  {patient.bloodTypeText}
                </span>
              </>
            )}
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-white border border-medical-200 text-medical-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          {patient.insuranceTypeText}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <InfoRow
          icon={<IdCard className="w-3.5 h-3.5 text-slate-400" />}
          label="TC Kimlik"
          value={patient.nationalId}
          mono
        />
        <InfoRow
          icon={<Phone className="w-3.5 h-3.5 text-slate-400" />}
          label="Telefon"
          value={patient.phone}
          mono
        />
        <InfoRow
          icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
          label="Adres"
          value={
            location
              ? patient.address
                ? `${patient.address} — ${location}`
                : location
              : patient.address ?? "—"
          }
        />
        <InfoRow
          icon={<HeartPulse className="w-3.5 h-3.5 text-slate-400" />}
          label="Acil İletişim"
          value={
            patient.emergencyContactName || patient.emergencyContactPhone
              ? `${patient.emergencyContactName ?? "—"}${
                  patient.emergencyContactPhone
                    ? ` · ${patient.emergencyContactPhone}`
                    : ""
                }`
              : "—"
          }
        />
      </div>

      {(patient.allergies || patient.chronicDiseases) && (
        <div className="mt-3 pt-3 border-t border-medical-100/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {patient.allergies && (
            <MedicalTag
              icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
              label="Alerjiler"
              text={patient.allergies}
              tone="amber"
            />
          )}
          {patient.chronicDiseases && (
            <MedicalTag
              icon={<Stethoscope className="w-3.5 h-3.5 text-rose-600" />}
              label="Kronik Hastalıklar"
              text={patient.chronicDiseases}
              tone="rose"
            />
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="shrink-0">{icon}</span>
      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium shrink-0">
        {label}
      </span>
      <span
        className={`text-slate-700 truncate ${mono ? "tabular-nums" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function MedicalTag({
  icon,
  label,
  text,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  tone: "amber" | "rose";
}) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-rose-50 border-rose-200 text-rose-900";
  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold mb-0.5">
        {icon}
        {label}
      </div>
      <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{text}</p>
    </div>
  );
}

function TimelineItem({ record }: { record: MedicalRecord }) {
  const date = new Date(record.appointmentDate);
  const v = record.vitalSigns;
  const hasVitals =
    !!v &&
    (v.bloodPressureSystolic != null ||
      v.bloodPressureDiastolic != null ||
      v.pulse != null ||
      v.temperature != null ||
      v.oxygenSaturation != null ||
      v.respiratoryRate != null ||
      v.height != null ||
      v.weight != null);

  return (
    <li className="relative">
      <span className="absolute -left-6 top-2 w-[18px] h-[18px] rounded-full bg-white border-2 border-medical-500 flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-medical-500" />
      </span>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-medical-200 hover:shadow transition-all">
        <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
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
              <span className="text-slate-300">·</span>
              <span>{record.doctorBranch}</span>
            </div>
          </div>
        </div>

        {hasVitals && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {v?.bloodPressureSystolic != null && v?.bloodPressureDiastolic != null && (
              <VitalChip
                icon={<HeartPulse className="w-3 h-3" />}
                value={`${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`}
                unit="mmHg"
              />
            )}
            {v?.pulse != null && (
              <VitalChip
                icon={<Activity className="w-3 h-3" />}
                value={String(v.pulse)}
                unit="/dk"
              />
            )}
            {v?.temperature != null && (
              <VitalChip
                icon={<Thermometer className="w-3 h-3" />}
                value={String(v.temperature)}
                unit="°C"
              />
            )}
            {v?.oxygenSaturation != null && (
              <VitalChip
                icon={<Droplet className="w-3 h-3" />}
                value={String(v.oxygenSaturation)}
                unit="%"
              />
            )}
            {v?.respiratoryRate != null && (
              <VitalChip
                icon={<Wind className="w-3 h-3" />}
                value={String(v.respiratoryRate)}
                unit="/dk"
              />
            )}
            {v?.height != null && (
              <VitalChip
                icon={<User className="w-3 h-3" />}
                value={String(v.height)}
                unit="cm"
              />
            )}
            {v?.weight != null && (
              <VitalChip
                icon={<Weight className="w-3 h-3" />}
                value={String(v.weight)}
                unit="kg"
              />
            )}
          </div>
        )}

        <SoapBlock
          label="Şikayet"
          value={record.chiefComplaint}
          icon={<ClipboardList className="w-3 h-3" />}
        />
        {record.history && (
          <SoapBlock
            label="Anamnez"
            value={record.history}
            icon={<FileText className="w-3 h-3" />}
          />
        )}
        {record.examination && (
          <SoapBlock
            label="Fizik Muayene"
            value={record.examination}
            icon={<Stethoscope className="w-3 h-3" />}
          />
        )}
        <SoapBlock
          label="Tanı"
          value={record.diagnosis}
          code={record.diagnosisCode}
          icon={<HeartPulse className="w-3 h-3" />}
          highlight
        />
        {record.treatmentPlan && (
          <SoapBlock
            label="Tedavi Planı"
            value={record.treatmentPlan}
            icon={<Pill className="w-3 h-3" />}
          />
        )}
        {record.notes && (
          <SoapBlock
            label="Notlar"
            value={record.notes}
            icon={<FileText className="w-3 h-3" />}
          />
        )}

        {record.prescription && record.prescription.items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-medical-700 font-semibold mb-2">
              <FileSignature className="w-3 h-3" />
              Reçete
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-medical-100 text-medical-800 normal-case tracking-normal">
                {record.prescription.prescriptionNumber}
              </span>
            </div>
            <div className="rounded-md border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-medium">İlaç</th>
                    <th className="text-left px-2 py-1.5 font-medium">Doz</th>
                    <th className="text-left px-2 py-1.5 font-medium">Sıklık</th>
                    <th className="text-left px-2 py-1.5 font-medium">Süre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {record.prescription.items.map((it, i) => (
                    <tr key={it.id ?? i}>
                      <td className="px-2 py-1.5 text-slate-800 font-medium">{it.medicationName}</td>
                      <td className="px-2 py-1.5 text-slate-600 tabular-nums">{it.dosage}</td>
                      <td className="px-2 py-1.5 text-slate-600">{it.frequency}</td>
                      <td className="px-2 py-1.5 text-slate-600">{it.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function VitalChip({
  icon,
  value,
  unit,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 tabular-nums">
      <span className="text-medical-600">{icon}</span>
      <span className="font-medium">{value}</span>
      <span className="text-slate-400">{unit}</span>
    </span>
  );
}

function SoapBlock({
  label,
  value,
  code,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  code?: string | null;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
        {icon}
        {label}
        {code && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-medical-100 text-medical-800 normal-case tracking-normal">
            <Tag className="w-2.5 h-2.5" />
            {code}
          </span>
        )}
      </div>
      <p
        className={`text-sm whitespace-pre-wrap break-words ${
          highlight ? "text-slate-900 font-medium" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
