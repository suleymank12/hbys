import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertCircle, CalendarCheck } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { DatePicker } from "../../components/ui/DatePicker";
import { Select } from "../../components/ui/Select";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import {
  AppointmentStatus,
  AppointmentType,
  type Appointment,
  type CreateAppointmentDto,
  type Doctor,
  type Patient,
} from "../../types";

interface FormValues {
  patientId: number | null;
  doctorId: number | null;
  date: string;
  time: string;
  type: AppointmentType;
}

const TYPE_OPTIONS = [
  { value: String(AppointmentType.Poliklinik), label: "Poliklinik" },
  { value: String(AppointmentType.Kontrol), label: "Kontrol" },
  { value: String(AppointmentType.Acil), label: "Acil" },
];

interface Props {
  open: boolean;
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  onClose: () => void;
  onSubmit: (dto: CreateAppointmentDto) => Promise<void>;
  initialDate?: string;
  initialTime?: string;
}

const SLOT_MINUTES = 30;

const toDateKey = (d: Date) => format(d, "yyyy-MM-dd");
const toTimeKey = (d: Date) => format(d, "HH:mm");

const isoDayOfWeek = (d: Date): number => {
  const js = d.getDay(); // 0=Sunday..6=Saturday
  return js === 0 ? 7 : js;
};

const parseHm = (hm: string): number => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

const formatHm = (mins: number): string =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

const generateSlots = (startHm: string, endHm: string): string[] => {
  const start = parseHm(startHm);
  const end = parseHm(endHm);
  const slots: string[] = [];
  for (let t = start; t + SLOT_MINUTES <= end; t += SLOT_MINUTES) {
    slots.push(formatHm(t));
  }
  return slots;
};

function toIsoUtc(date: string, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const local = new Date(date);
  local.setHours(h, m, 0, 0);
  return local.toISOString();
}

export function AppointmentFormModal({
  open,
  patients,
  doctors,
  appointments,
  onClose,
  onSubmit,
  initialDate,
  initialTime,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const {
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      patientId: null,
      doctorId: null,
      date: "",
      time: "",
      type: AppointmentType.Poliklinik,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        patientId: null,
        doctorId: null,
        date: initialDate ?? "",
        time: initialTime ?? "",
        type: AppointmentType.Poliklinik,
      });
      setPreview(null);
    }
  }, [open, reset, initialDate, initialTime]);

  const date = watch("date");
  const time = watch("time");
  const doctorId = watch("doctorId");

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === doctorId) ?? null,
    [doctors, doctorId]
  );

  const scheduleByDay = useMemo(() => {
    const map = new Map<number, { start: string; end: string }>();
    selectedDoctor?.schedules.forEach((s) =>
      map.set(s.dayOfWeek, { start: s.startTime, end: s.endTime })
    );
    return map;
  }, [selectedDoctor]);

  const daySchedule = useMemo(() => {
    if (!date) return null;
    const d = new Date(date);
    return scheduleByDay.get(isoDayOfWeek(d)) ?? null;
  }, [date, scheduleByDay]);

  const daySlots = useMemo(
    () => (daySchedule ? generateSlots(daySchedule.start, daySchedule.end) : []),
    [daySchedule]
  );

  useEffect(() => {
    if (date && time) {
      const dt = new Date(toIsoUtc(date, time));
      setPreview(format(dt, "dd MMMM yyyy, HH:mm", { locale: tr }));
    } else {
      setPreview(null);
    }
  }, [date, time]);

  const doctorAppointments = useMemo(() => {
    if (doctorId == null) return [];
    return appointments.filter(
      (a) =>
        a.doctorId === doctorId &&
        a.status !== AppointmentStatus.IptalEdildi &&
        a.status !== AppointmentStatus.Gelmedi
    );
  }, [appointments, doctorId]);

  const takenByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    doctorAppointments.forEach((a) => {
      const d = new Date(a.dateTime);
      const key = toDateKey(d);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(toTimeKey(d));
    });
    return map;
  }, [doctorAppointments]);

  const isDateDisabled = (d: Date): boolean => {
    const day = isoDayOfWeek(d);
    const sch = scheduleByDay.get(day);
    if (!sch) return true;
    const slots = generateSlots(sch.start, sch.end);
    if (slots.length === 0) return true;
    const taken = takenByDate.get(toDateKey(d)) ?? new Set<string>();
    return slots.every((t) => taken.has(t));
  };

  const timeOptions = useMemo(() => {
    const taken = date ? takenByDate.get(date) ?? new Set<string>() : new Set<string>();
    return daySlots.map((t) => {
      const isTaken = taken.has(t);
      return {
        value: t,
        label: t,
        disabled: isTaken,
        hint: isTaken ? "dolu" : undefined,
      };
    });
  }, [date, daySlots, takenByDate]);

  const showOffDayWarning = !!doctorId && !!date && !daySchedule;

  useEffect(() => {
    if (!time) return;
    const opt = timeOptions.find((o) => o.value === time);
    if (!opt || opt.disabled) {
      reset((v) => ({ ...v, time: "" }));
    }
  }, [doctorId, date, daySchedule]); // eslint-disable-line react-hooks/exhaustive-deps

  const patientOptions = useMemo(
    () =>
      patients.map((p) => ({
        value: p.id,
        label: p.fullName,
        sublabel: p.nationalId,
      })),
    [patients]
  );

  const doctorOptions = useMemo(
    () =>
      doctors.map((d) => ({
        value: d.id,
        label: d.displayName,
        sublabel: d.branch,
      })),
    [doctors]
  );

  const submit = handleSubmit(async (values) => {
    if (values.patientId == null || values.doctorId == null) return;
    const dto: CreateAppointmentDto = {
      patientId: values.patientId,
      doctorId: values.doctorId,
      dateTime: toIsoUtc(values.date, values.time),
      type: values.type,
    };
    await onSubmit(dto);
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni Randevu"
      description="Hasta ve doktor için müsait bir zaman seçin."
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <Controller
          control={control}
          name="patientId"
          rules={{ required: "Hasta seçiniz." }}
          render={({ field }) => (
            <SearchableSelect
              label="Hasta"
              value={field.value}
              onChange={(v) => field.onChange(v as number)}
              options={patientOptions}
              placeholder="Hasta seçiniz"
              searchPlaceholder="İsim veya TC ile ara..."
              error={errors.patientId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="doctorId"
          rules={{ required: "Doktor seçiniz." }}
          render={({ field }) => (
            <SearchableSelect
              label="Doktor"
              value={field.value}
              onChange={(v) => field.onChange(v as number)}
              options={doctorOptions}
              placeholder="Doktor seçiniz"
              searchPlaceholder="İsim veya branş ile ara..."
              error={errors.doctorId?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="date"
            rules={{
              required: "Tarih seçiniz.",
              validate: (v) => {
                const d = new Date(v);
                d.setHours(23, 59, 59, 999);
                return d >= new Date() || "Geçmiş tarih seçilemez.";
              },
            }}
            render={({ field }) => (
              <DatePicker
                label="Randevu Tarihi"
                value={field.value}
                onChange={field.onChange}
                minDate={tomorrow}
                isDateDisabled={doctorId != null ? isDateDisabled : undefined}
                error={errors.date?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="time"
            rules={{ required: "Saat seçiniz." }}
            render={({ field }) => (
              <Select
                label="Randevu Saati"
                value={field.value}
                onChange={field.onChange}
                options={timeOptions}
                placeholder={
                  !doctorId
                    ? "Önce doktor seçiniz"
                    : !date
                    ? "Önce tarih seçiniz"
                    : !daySchedule
                    ? "Mesai dışı"
                    : "Saat seçiniz"
                }
                disabled={!doctorId || !date || !daySchedule}
                error={errors.time?.message}
              />
            )}
          />
        </div>

        {showOffDayWarning && (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Bu doktor seçilen günde çalışmıyor. Lütfen başka bir gün seçin.
            </span>
          </div>
        )}

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              label="Randevu Tipi"
              value={String(field.value)}
              onChange={(v) => field.onChange(Number(v) as AppointmentType)}
              options={TYPE_OPTIONS}
            />
          )}
        />

        {preview && (
          <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-medical-50 border border-medical-100 text-sm text-medical-800">
            <CalendarCheck className="w-4 h-4 text-medical-600 shrink-0" />
            <span>
              Randevu:{" "}
              <span className="font-semibold">{preview}</span>
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Randevu Oluştur
          </Button>
        </div>
      </form>
    </Modal>
  );
}
