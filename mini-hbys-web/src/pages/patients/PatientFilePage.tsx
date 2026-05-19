import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { differenceInYears, format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Download,
  Droplet,
  FileSignature,
  FileText,
  HeartPulse,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
  Tag,
  Thermometer,
  User,
  UserCheck,
  Weight,
  Wind,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { StatusBadge, AppointmentTypeBadge } from "../../components/ui/StatusBadge";
import { patientService } from "../../services/patientService";
import { appointmentService } from "../../services/appointmentService";
import { medicalRecordService } from "../../services/medicalRecordService";
import { prescriptionService } from "../../services/prescriptionService";
import { useAuth } from "../../contexts/AuthContext";
import { PatientFormModal } from "./PatientFormModal";
import type {
  Appointment,
  CreatePatientDto,
  MedicalRecord,
  Patient,
  Prescription,
  UpdatePatientDto,
} from "../../types";

type TabKey = "appointments" | "records" | "prescriptions";

const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: "appointments", label: "Randevular", icon: CalendarDays },
  { key: "records", label: "Muayene Kayıtları", icon: ClipboardList },
  { key: "prescriptions", label: "Reçeteler", icon: FileSignature },
];

const initialsOf = (name: string, surname: string) => {
  const a = name?.trim().charAt(0) ?? "";
  const b = surname?.trim().charAt(0) ?? "";
  return (a + b).toUpperCase() || "—";
};

export function PatientFilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canWrite = hasRole("Admin", "Sekreter");
  const patientId = Number(id);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<TabKey>("appointments");
  const [editOpen, setEditOpen] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [tabLoading, setTabLoading] = useState<Record<TabKey, boolean>>({
    appointments: false,
    records: false,
    prescriptions: false,
  });
  const [tabLoaded, setTabLoaded] = useState<Record<TabKey, boolean>>({
    appointments: false,
    records: false,
    prescriptions: false,
  });

  const loadPatient = async () => {
    if (!Number.isFinite(patientId) || patientId <= 0) {
      setNotFound(true);
      setPatientLoading(false);
      return;
    }
    setPatientLoading(true);
    setNotFound(false);
    try {
      const p = await patientService.getById(patientId);
      setPatient(p);
    } catch {
      setNotFound(true);
    } finally {
      setPatientLoading(false);
    }
  };

  useEffect(() => {
    loadPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  useEffect(() => {
    if (!patient || tabLoaded[tab]) return;
    const run = async () => {
      setTabLoading((s) => ({ ...s, [tab]: true }));
      try {
        if (tab === "appointments") {
          const list = await appointmentService.listByPatient(patient.id);
          setAppointments(list);
        } else if (tab === "records") {
          const list = await medicalRecordService.getByPatientId(patient.id);
          setRecords(list);
        } else {
          const list = await prescriptionService.getByPatient(patient.id);
          setPrescriptions(list);
        }
        setTabLoaded((s) => ({ ...s, [tab]: true }));
      } catch {
        /* interceptor */
      } finally {
        setTabLoading((s) => ({ ...s, [tab]: false }));
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, patient]);

  const handleEditSubmit = async (
    dto: CreatePatientDto | UpdatePatientDto,
    pid?: number
  ) => {
    if (pid === undefined) return;
    try {
      await patientService.update(pid, dto as UpdatePatientDto);
      toast.success("Hasta güncellendi.");
      setEditOpen(false);
      await loadPatient();
    } catch {
      /* interceptor */
    }
  };

  if (patientLoading) {
    return <PatientFileSkeleton />;
  }

  if (notFound || !patient) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-sm text-center">
        <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          Hasta bulunamadı
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Aradığınız hasta kaydı silinmiş veya erişiminiz olmayabilir.
        </p>
        <Button variant="secondary" onClick={() => navigate("/patients")}>
          Hasta listesine dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-medical-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Hasta Listesi
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-700 truncate">
          {patient.fullName}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
        <PatientPanel
          patient={patient}
          canWrite={canWrite}
          onEdit={() => setEditOpen(true)}
        />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="border-b border-slate-200 bg-slate-50/50 px-2 sm:px-4">
            <div className="flex items-center gap-1 overflow-x-auto">
              {TABS.map(({ key, label, icon: Icon }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`
                      inline-flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium
                      border-b-2 -mb-px transition-colors whitespace-nowrap
                      ${
                        active
                          ? "border-medical-600 text-medical-700"
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-5 flex-1">
            {tab === "appointments" && (
              <AppointmentsTab
                loading={tabLoading.appointments}
                appointments={appointments}
              />
            )}
            {tab === "records" && (
              <RecordsTab loading={tabLoading.records} records={records} />
            )}
            {tab === "prescriptions" && (
              <PrescriptionsTab
                loading={tabLoading.prescriptions}
                prescriptions={prescriptions}
              />
            )}
          </div>
        </div>
      </div>

      {canWrite && (
        <PatientFormModal
          open={editOpen}
          patient={patient}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}

function PatientFileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="h-20 w-20 rounded-full bg-slate-100 animate-pulse mx-auto" />
        <div className="h-4 w-32 bg-slate-100 rounded animate-pulse mx-auto" />
        <div className="h-3 w-48 bg-slate-100 rounded animate-pulse mx-auto" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-full bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 min-h-[400px]">
        <div className="h-6 w-40 bg-slate-100 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PatientPanel({
  patient,
  canWrite,
  onEdit,
}: {
  patient: Patient;
  canWrite: boolean;
  onEdit: () => void;
}) {
  const age = differenceInYears(new Date(), new Date(patient.birthDate));
  const location = [patient.district, patient.city]
    .filter((x): x is string => !!x && x.trim().length > 0)
    .join(", ");

  return (
    <aside className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:sticky lg:top-20 self-start">
      <div className="bg-gradient-to-br from-medical-600 via-medical-700 to-medical-800 p-5 text-white">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/15 ring-4 ring-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold mb-3">
            {initialsOf(patient.name, patient.surname)}
          </div>
          <div className="text-base font-semibold leading-tight">
            {patient.fullName}
          </div>
          <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-white/15 ring-1 ring-white/25">
            {patient.protocolNumber}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-white/85 flex-wrap justify-center">
            <span>{age} yaş</span>
            <span className="text-white/40">·</span>
            <span>{patient.genderText}</span>
            {patient.bloodTypeText && (
              <>
                <span className="text-white/40">·</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <Droplet className="w-3 h-3" />
                  {patient.bloodTypeText}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <InfoRow
          icon={<IdCard className="w-3.5 h-3.5" />}
          label="TC Kimlik"
          value={patient.nationalId}
          mono
        />
        <InfoRow
          icon={<Phone className="w-3.5 h-3.5" />}
          label="Telefon"
          value={patient.phone}
          mono
        />
        {patient.email && (
          <InfoRow
            icon={<Mail className="w-3.5 h-3.5" />}
            label="E-posta"
            value={patient.email}
          />
        )}
        {location && (
          <InfoRow
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="İl / İlçe"
            value={location}
          />
        )}
        {patient.address && (
          <InfoRow
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="Adres"
            value={patient.address}
            multiline
          />
        )}

        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" />
            Sigorta
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-medical-50 text-medical-700 ring-1 ring-medical-200/60">
            {patient.insuranceTypeText}
          </span>
        </div>

        {(patient.emergencyContactName || patient.emergencyContactPhone) && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3 h-3" />
              Acil İletişim
            </div>
            <div className="text-sm text-slate-700">
              {patient.emergencyContactName ?? "—"}
            </div>
            {patient.emergencyContactPhone && (
              <div className="text-xs text-slate-500 tabular-nums">
                {patient.emergencyContactPhone}
              </div>
            )}
          </div>
        )}

        {patient.allergies && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 mt-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-rose-800 mb-0.5">
              <AlertTriangle className="w-3 h-3" />
              Alerjiler
            </div>
            <p className="text-xs leading-relaxed text-rose-900 whitespace-pre-wrap break-words">
              {patient.allergies}
            </p>
          </div>
        )}

        {patient.chronicDiseases && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-amber-800 mb-0.5">
              <Stethoscope className="w-3 h-3" />
              Kronik Hastalıklar
            </div>
            <p className="text-xs leading-relaxed text-amber-900 whitespace-pre-wrap break-words">
              {patient.chronicDiseases}
            </p>
          </div>
        )}

        {canWrite && (
          <div className="pt-3 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              icon={<Pencil className="w-3.5 h-3.5" />}
              onClick={onEdit}
            >
              Düzenle
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
  multiline,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-0.5 flex items-center gap-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <div
        className={`text-sm text-slate-800 ${mono ? "tabular-nums font-mono text-[13px]" : ""} ${
          multiline ? "whitespace-pre-wrap break-words" : "truncate"
        }`}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function AppointmentsTab({
  loading,
  appointments,
}: {
  loading: boolean;
  appointments: Appointment[];
}) {
  if (loading) {
    return <TabSkeleton />;
  }
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Randevu bulunmuyor"
        message="Bu hastaya ait randevu kaydı yok."
      />
    );
  }
  const sorted = [...appointments].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-5">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 sm:px-5 py-2.5 font-medium">Tarih & Saat</th>
            <th className="text-left px-4 sm:px-5 py-2.5 font-medium">Doktor</th>
            <th className="text-center px-4 sm:px-5 py-2.5 font-medium">Tip</th>
            <th className="text-center px-4 sm:px-5 py-2.5 font-medium">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((a) => {
            const dt = new Date(a.dateTime);
            return (
              <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 sm:px-5 py-2.5">
                  <div className="font-medium text-slate-900 tabular-nums">
                    {format(dt, "dd MMM yyyy", { locale: tr })}
                  </div>
                  <div className="text-xs text-slate-500 tabular-nums">
                    {format(dt, "HH:mm")}
                  </div>
                </td>
                <td className="px-4 sm:px-5 py-2.5">
                  <div className="text-slate-700">{a.doctorName}</div>
                  <div className="text-xs text-slate-500">{a.doctorBranch}</div>
                </td>
                <td className="px-4 sm:px-5 py-2.5 text-center">
                  <AppointmentTypeBadge type={a.type} />
                </td>
                <td className="px-4 sm:px-5 py-2.5 text-center">
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecordsTab({
  loading,
  records,
}: {
  loading: boolean;
  records: MedicalRecord[];
}) {
  if (loading) {
    return <TabSkeleton />;
  }
  if (records.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Muayene kaydı yok"
        message="Bu hastaya ait muayene kaydı bulunmuyor."
      />
    );
  }
  return (
    <ol className="relative space-y-4 pl-6 pr-1">
      <span className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
      {records.map((r) => (
        <RecordTimelineItem key={r.id} record={r} />
      ))}
    </ol>
  );
}

function PrescriptionsTab({
  loading,
  prescriptions,
}: {
  loading: boolean;
  prescriptions: Prescription[];
}) {
  const sorted = useMemo(
    () =>
      [...prescriptions].sort(
        (a, b) =>
          new Date(b.prescribedAt).getTime() - new Date(a.prescribedAt).getTime()
      ),
    [prescriptions]
  );

  if (loading) {
    return <TabSkeleton />;
  }
  if (prescriptions.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title="Reçete yok"
        message="Bu hastaya ait reçete kaydı bulunmuyor."
      />
    );
  }
  return (
    <div className="space-y-3">
      {sorted.map((p) => (
        <PrescriptionCard key={p.id} prescription={p} />
      ))}
    </div>
  );
}

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-medical-200 hover:shadow transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-medical-100 text-medical-800">
            <FileSignature className="w-3 h-3" />
            {prescription.prescriptionNumber}
          </span>
          <span className="text-sm text-slate-700 tabular-nums">
            {format(new Date(prescription.prescribedAt), "dd MMMM yyyy", {
              locale: tr,
            })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Stethoscope className="w-3.5 h-3.5" />
          {prescription.doctorName}
          <span className="text-slate-300">·</span>
          <span>{prescription.doctorBranch}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left px-3 py-1.5 font-medium">İlaç</th>
              <th className="text-left px-3 py-1.5 font-medium">Doz</th>
              <th className="text-left px-3 py-1.5 font-medium">Sıklık</th>
              <th className="text-left px-3 py-1.5 font-medium">Süre</th>
              <th className="text-left px-3 py-1.5 font-medium">Açıklama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {prescription.items.map((it, i) => (
              <tr key={it.id ?? i}>
                <td className="px-3 py-1.5 text-slate-800 font-medium">
                  {it.medicationName}
                </td>
                <td className="px-3 py-1.5 text-slate-600 tabular-nums">
                  {it.dosage}
                </td>
                <td className="px-3 py-1.5 text-slate-600">{it.frequency}</td>
                <td className="px-3 py-1.5 text-slate-600">{it.duration}</td>
                <td className="px-3 py-1.5 text-slate-500">
                  {it.instructions || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordTimelineItem({ record }: { record: MedicalRecord }) {
  const date = new Date(record.appointmentDate);
  const v = record.vitalSigns;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const stamp = format(date, "yyyyMMdd");
      await medicalRecordService.downloadEpikrizPdf(
        record.id,
        `Epikriz_${record.id}_${stamp}.pdf`
      );
    } catch {
      /* interceptor */
    } finally {
      setDownloading(false);
    }
  };
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownload}
            loading={downloading}
            className="text-medical-700 hover:bg-medical-50"
          >
            PDF
          </Button>
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
                      <td className="px-2 py-1.5 text-slate-800 font-medium">
                        {it.medicationName}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600 tabular-nums">
                        {it.dosage}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">
                        {it.frequency}
                      </td>
                      <td className="px-2 py-1.5 text-slate-600">
                        {it.duration}
                      </td>
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

function TabSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: typeof CalendarDays;
  title: string;
  message: string;
}) {
  return (
    <div className="py-16 text-center">
      <Icon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
      <h3 className="text-sm font-medium text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  );
}
