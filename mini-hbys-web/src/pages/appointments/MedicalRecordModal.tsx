import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  Activity,
  CalendarClock,
  ClipboardList,
  Droplet,
  FileText,
  HeartPulse,
  Pill,
  Search,
  Stethoscope,
  Tag,
  Thermometer,
  User,
  Weight,
  Wind,
  X,
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { TextArea } from "../../components/ui/TextArea";
import { medicalRecordService } from "../../services/medicalRecordService";
import { icd10Service } from "../../services/icd10Service";
import { useAuth } from "../../contexts/AuthContext";
import type { Appointment, Icd10Code, MedicalRecord, VitalSigns } from "../../types";

interface FormValues {
  chiefComplaint: string;
  history: string;
  examination: string;
  diagnosis: string;
  diagnosisCode: string;
  treatmentPlan: string;
  notes: string;
  systolic: string;
  diastolic: string;
  pulse: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  height: string;
  weight: string;
}

interface Props {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSaved?: () => void;
  readonly?: boolean;
}

const numOrNull = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const strOrEmpty = (s: number | null | undefined) =>
  s === null || s === undefined ? "" : String(s);

const hasAnyVital = (v: VitalSigns | null | undefined): boolean =>
  !!v &&
  (v.bloodPressureSystolic != null ||
    v.bloodPressureDiastolic != null ||
    v.pulse != null ||
    v.temperature != null ||
    v.respiratoryRate != null ||
    v.oxygenSaturation != null ||
    v.height != null ||
    v.weight != null);

export function MedicalRecordModal({
  open,
  appointment,
  onClose,
  onSaved,
  readonly = false,
}: Props) {
  const { hasRole } = useAuth();
  const canEdit = hasRole("Doktor");
  const effectiveReadonly = readonly || !canEdit;

  const [existing, setExisting] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  useEffect(() => {
    if (!open || !appointment) return;
    setLoading(true);
    setExisting(null);
    reset(emptyValues());

    medicalRecordService
      .getByAppointmentId(appointment.id)
      .then((record) => {
        if (record) {
          setExisting(record);
          reset(toFormValues(record));
        }
      })
      .finally(() => setLoading(false));
  }, [open, appointment, reset]);

  const isEdit = !!existing;

  const submit = handleSubmit(async (values) => {
    if (!appointment) return;
    try {
      const vitals: VitalSigns = {
        bloodPressureSystolic: numOrNull(values.systolic),
        bloodPressureDiastolic: numOrNull(values.diastolic),
        pulse: numOrNull(values.pulse),
        temperature: numOrNull(values.temperature),
        respiratoryRate: numOrNull(values.respiratoryRate),
        oxygenSaturation: numOrNull(values.oxygenSaturation),
        height: numOrNull(values.height),
        weight: numOrNull(values.weight),
      };
      const payload = {
        chiefComplaint: values.chiefComplaint.trim(),
        history: values.history.trim() || null,
        examination: values.examination.trim() || null,
        diagnosis: values.diagnosis.trim(),
        diagnosisCode: values.diagnosisCode.trim() || null,
        treatmentPlan: values.treatmentPlan.trim() || null,
        notes: values.notes.trim() || null,
        vitalSigns: hasAnyVital(vitals) ? vitals : null,
      };

      if (isEdit) {
        await medicalRecordService.update(existing!.id, payload);
        toast.success("Muayene kaydı güncellendi.");
      } else {
        await medicalRecordService.create({
          appointmentId: appointment.id,
          ...payload,
        });
        toast.success("Muayene kaydı oluşturuldu.");
      }
      onSaved?.();
      onClose();
    } catch {
      /* interceptor */
    }
  });

  if (!appointment) return null;

  const apptDate = new Date(appointment.dateTime);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        effectiveReadonly
          ? "Muayene Kaydı Detayı"
          : isEdit
          ? "Muayene Kaydını Düzenle"
          : "Muayene Kaydı Oluştur"
      }
      description={
        effectiveReadonly
          ? "Muayene kaydı bilgileri."
          : isEdit
          ? "Mevcut kaydı güncelleyin."
          : "Bu randevu için SOAP formatında muayene kaydı oluşturun."
      }
      size="lg"
    >
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <InfoItem
            icon={<User className="w-4 h-4" />}
            label="Hasta"
            value={appointment.patientFullName}
          />
          <InfoItem
            icon={<Stethoscope className="w-4 h-4" />}
            label="Doktor"
            value={appointment.doctorName}
            sub={appointment.doctorBranch}
          />
          <InfoItem
            icon={<CalendarClock className="w-4 h-4" />}
            label="Randevu"
            value={format(apptDate, "dd MMM yyyy", { locale: tr })}
            sub={format(apptDate, "HH:mm")}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      ) : effectiveReadonly ? (
        <ReadonlyView record={existing} onClose={onClose} />
      ) : (
        <form
          onSubmit={submit}
          className="space-y-5 max-h-[65vh] overflow-y-auto -mx-6 px-6 pb-1"
        >
          <Section title="Vital Bulgular" icon={<Activity className="w-4 h-4" />}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <BPInput
                label="Tansiyon"
                unit="mmHg"
                icon={<HeartPulse className="w-3.5 h-3.5" />}
                systolicProps={register("systolic", { min: 40, max: 300 })}
                diastolicProps={register("diastolic", { min: 20, max: 200 })}
              />
              <NumberInput
                label="Nabız"
                unit="/dk"
                icon={<Activity className="w-3.5 h-3.5" />}
                {...register("pulse", { min: 20, max: 250 })}
              />
              <NumberInput
                label="Ateş"
                unit="°C"
                step="0.1"
                icon={<Thermometer className="w-3.5 h-3.5" />}
                {...register("temperature", { min: 25, max: 45 })}
              />
              <NumberInput
                label="SpO2"
                unit="%"
                icon={<Droplet className="w-3.5 h-3.5" />}
                {...register("oxygenSaturation", { min: 50, max: 100 })}
              />
              <NumberInput
                label="Solunum"
                unit="/dk"
                icon={<Wind className="w-3.5 h-3.5" />}
                {...register("respiratoryRate", { min: 5, max: 80 })}
              />
              <NumberInput
                label="Boy"
                unit="cm"
                step="0.1"
                icon={<User className="w-3.5 h-3.5" />}
                {...register("height", { min: 20, max: 250 })}
              />
              <NumberInput
                label="Kilo"
                unit="kg"
                step="0.1"
                icon={<Weight className="w-3.5 h-3.5" />}
                {...register("weight", { min: 1, max: 500 })}
              />
            </div>
          </Section>

          <Section title="Başvuru Şikayeti" icon={<ClipboardList className="w-4 h-4" />}>
            <TextArea
              label=""
              rows={2}
              placeholder="Hastanın başvuru nedeni — örn: 'Baş ağrısı, 3 gündür devam ediyor'"
              error={errors.chiefComplaint?.message}
              {...register("chiefComplaint", {
                required: "Başvuru şikayeti zorunludur.",
                maxLength: { value: 1000, message: "En fazla 1000 karakter." },
              })}
            />
          </Section>

          <Section title="Anamnez (Hikaye)" icon={<FileText className="w-4 h-4" />}>
            <TextArea
              label=""
              rows={3}
              placeholder="Hastanın anlattıkları, geçmiş tıbbi öykü, kullandığı ilaçlar..."
              {...register("history", { maxLength: 2000 })}
            />
          </Section>

          <Section title="Fizik Muayene" icon={<Stethoscope className="w-4 h-4" />}>
            <TextArea
              label=""
              rows={3}
              placeholder="Genel görünüm, sistemik muayene bulguları..."
              {...register("examination", { maxLength: 2000 })}
            />
          </Section>

          <Section title="Tanı (ICD-10)" icon={<HeartPulse className="w-4 h-4" />}>
            <Icd10Search
              onSelect={(c) => {
                setValue("diagnosisCode", c.code, { shouldDirty: true });
                setValue("diagnosis", c.nameTr, { shouldDirty: true });
              }}
            />

            {watch("diagnosisCode") && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-medical-50 border border-medical-200 text-medical-800 text-xs font-medium">
                  <Tag className="w-3 h-3" />
                  <span className="font-mono">{watch("diagnosisCode")}</span>
                  <button
                    type="button"
                    onClick={() => setValue("diagnosisCode", "", { shouldDirty: true })}
                    className="ml-0.5 -mr-0.5 hover:text-rose-600 transition-colors"
                    aria-label="ICD-10 kodunu kaldır"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              </div>
            )}

            <div className="mt-2">
              <TextArea
                label=""
                rows={2}
                placeholder="Tanı açıklaması — ICD-10 seçtiğinizde otomatik dolar, isterseniz düzenleyebilirsiniz."
                error={errors.diagnosis?.message}
                {...register("diagnosis", {
                  required: "Tanı zorunludur.",
                  maxLength: { value: 500, message: "En fazla 500 karakter." },
                })}
              />
            </div>
          </Section>

          <Section title="Tedavi Planı" icon={<Pill className="w-4 h-4" />}>
            <TextArea
              label=""
              rows={3}
              placeholder="İlaç, doz, süre, istirahat, kontrol tarihi..."
              {...register("treatmentPlan", { maxLength: 2000 })}
            />
          </Section>

          <Section title="Ek Notlar" icon={<FileText className="w-4 h-4" />}>
            <TextArea
              label=""
              rows={2}
              placeholder="Diğer notlar (opsiyonel)..."
              {...register("notes", { maxLength: 2000 })}
            />
          </Section>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Vazgeç
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? "Güncelle" : "Kaydet"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function emptyValues(): FormValues {
  return {
    chiefComplaint: "",
    history: "",
    examination: "",
    diagnosis: "",
    diagnosisCode: "",
    treatmentPlan: "",
    notes: "",
    systolic: "",
    diastolic: "",
    pulse: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    height: "",
    weight: "",
  };
}

function toFormValues(r: MedicalRecord): FormValues {
  const v = r.vitalSigns;
  return {
    chiefComplaint: r.chiefComplaint ?? "",
    history: r.history ?? "",
    examination: r.examination ?? "",
    diagnosis: r.diagnosis ?? "",
    diagnosisCode: r.diagnosisCode ?? "",
    treatmentPlan: r.treatmentPlan ?? "",
    notes: r.notes ?? "",
    systolic: strOrEmpty(v?.bloodPressureSystolic),
    diastolic: strOrEmpty(v?.bloodPressureDiastolic),
    pulse: strOrEmpty(v?.pulse),
    temperature: strOrEmpty(v?.temperature),
    respiratoryRate: strOrEmpty(v?.respiratoryRate),
    oxygenSaturation: strOrEmpty(v?.oxygenSaturation),
    height: strOrEmpty(v?.height),
    weight: strOrEmpty(v?.weight),
  };
}

function ReadonlyView({
  record,
  onClose,
}: {
  record: MedicalRecord | null;
  onClose: () => void;
}) {
  if (!record) {
    return (
      <div className="py-12 text-center text-slate-500">
        Kayıt bulunamadı.
      </div>
    );
  }
  const v = record.vitalSigns;
  const hasVitals = hasAnyVital(v);

  return (
    <div className="space-y-5 max-h-[65vh] overflow-y-auto -mx-6 px-6 pb-1">
      {hasVitals && (
        <Section title="Vital Bulgular" icon={<Activity className="w-4 h-4" />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {v?.bloodPressureSystolic != null && v?.bloodPressureDiastolic != null && (
              <VitalCard
                icon={<HeartPulse className="w-4 h-4" />}
                label="Tansiyon"
                value={`${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`}
                unit="mmHg"
              />
            )}
            {v?.pulse != null && (
              <VitalCard
                icon={<Activity className="w-4 h-4" />}
                label="Nabız"
                value={String(v.pulse)}
                unit="/dk"
              />
            )}
            {v?.temperature != null && (
              <VitalCard
                icon={<Thermometer className="w-4 h-4" />}
                label="Ateş"
                value={String(v.temperature)}
                unit="°C"
              />
            )}
            {v?.oxygenSaturation != null && (
              <VitalCard
                icon={<Droplet className="w-4 h-4" />}
                label="SpO2"
                value={String(v.oxygenSaturation)}
                unit="%"
              />
            )}
            {v?.respiratoryRate != null && (
              <VitalCard
                icon={<Wind className="w-4 h-4" />}
                label="Solunum"
                value={String(v.respiratoryRate)}
                unit="/dk"
              />
            )}
            {v?.height != null && (
              <VitalCard
                icon={<User className="w-4 h-4" />}
                label="Boy"
                value={String(v.height)}
                unit="cm"
              />
            )}
            {v?.weight != null && (
              <VitalCard
                icon={<Weight className="w-4 h-4" />}
                label="Kilo"
                value={String(v.weight)}
                unit="kg"
              />
            )}
          </div>
        </Section>
      )}

      <ReadonlySoap label="Başvuru Şikayeti" value={record.chiefComplaint} required />
      <ReadonlySoap label="Anamnez" value={record.history ?? ""} />
      <ReadonlySoap label="Fizik Muayene" value={record.examination ?? ""} />
      <ReadonlySoap
        label="Tanı"
        value={record.diagnosis}
        code={record.diagnosisCode}
        required
      />
      <ReadonlySoap label="Tedavi Planı" value={record.treatmentPlan ?? ""} />
      <ReadonlySoap label="Ek Notlar" value={record.notes ?? ""} />

      <div className="flex justify-center pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
        <Button type="button" variant="secondary" onClick={onClose}>
          Kapat
        </Button>
      </div>
    </div>
  );
}

function ReadonlySoap({
  label,
  value,
  code,
  required,
}: {
  label: string;
  value: string;
  code?: string | null;
  required?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-medical-700 mb-1.5 flex items-center gap-2">
        {label}
        {code && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-medical-100 text-medical-800 normal-case tracking-normal">
            <Tag className="w-2.5 h-2.5" />
            {code}
          </span>
        )}
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-800 whitespace-pre-wrap break-words min-h-[2.5rem]">
        {value.trim() ? value : <span className="text-slate-400">{required ? "—" : "Girilmedi"}</span>}
      </div>
    </div>
  );
}

function VitalCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
        <span className="text-medical-600">{icon}</span>
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold text-slate-900 tabular-nums">
        {value}
        <span className="ml-1 text-xs font-normal text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-medical-700">
        <span className="w-6 h-6 rounded-md bg-medical-50 flex items-center justify-center text-medical-600">
          {icon}
        </span>
        {title}
      </div>
      <div className="pl-1">{children}</div>
    </section>
  );
}

function NumberInput({
  label,
  unit,
  icon,
  step,
  ...rest
}: {
  label: string;
  unit: string;
  icon: ReactNode;
  step?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
        <span className="text-medical-600">{icon}</span>
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          step={step}
          inputMode="decimal"
          {...rest}
          className="w-full px-3 pr-12 py-2 text-sm rounded-lg border border-slate-300 bg-white
                     tabular-nums
                     focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
                     transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
          {unit}
        </span>
      </div>
    </label>
  );
}

function BPInput({
  label,
  unit,
  icon,
  systolicProps,
  diastolicProps,
}: {
  label: string;
  unit: string;
  icon: ReactNode;
  systolicProps: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  diastolicProps: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-1">
        <span className="text-medical-600">{icon}</span>
        {label}
      </span>
      <div className="flex items-center gap-1 relative">
        <input
          type="number"
          inputMode="numeric"
          placeholder="120"
          {...systolicProps}
          className="w-full min-w-0 px-2 py-2 text-sm rounded-lg border border-slate-300 bg-white tabular-nums
                     focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500"
        />
        <span className="text-slate-400 font-medium px-0.5">/</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="80"
          {...diastolicProps}
          className="w-full min-w-0 px-2 py-2 text-sm rounded-lg border border-slate-300 bg-white tabular-nums
                     focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500"
        />
      </div>
      <span className="block text-[10px] text-slate-400 mt-0.5">{unit}</span>
    </label>
  );
}

function InfoItem({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-md bg-white border border-slate-200 text-slate-500 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </div>
        <div className="text-sm font-medium text-slate-900 truncate">{value}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

function Icd10Search({
  onSelect,
}: {
  onSelect: (code: Icd10Code) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Icd10Code[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = window.setTimeout(async () => {
      try {
        const items = await icd10Service.search(trimmed);
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [term]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="ICD-10 kodu veya Türkçe tanı adı ile ara..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white
                     focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
                     transition-colors"
        />
      </div>
      {open && (loading || results.length > 0 || term.trim().length >= 1) && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200 max-h-72 overflow-y-auto animate-[modalIn_0.12s_ease-out]">
          {loading && (
            <div className="px-3 py-2.5 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-medical-500 border-t-transparent rounded-full animate-spin" />
              Aranıyor...
            </div>
          )}
          {!loading && results.length === 0 && term.trim().length >= 1 && (
            <div className="px-3 py-2.5 text-xs text-slate-500">Eşleşen kod bulunamadı.</div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.code}
                type="button"
                onClick={() => {
                  onSelect(r);
                  setTerm("");
                  setResults([]);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-medical-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <span className="font-mono font-semibold text-medical-700 shrink-0 mt-0.5">
                    {r.code}
                  </span>
                  <div className="min-w-0">
                    <div className="text-slate-800 break-words">{r.nameTr}</div>
                    <div className="text-[11px] text-slate-400 truncate">{r.category}</div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
