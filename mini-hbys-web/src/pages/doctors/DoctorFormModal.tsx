import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CalendarDays } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Select } from "../../components/ui/Select";
import { BRANCH_OPTIONS } from "../../constants/branches";
import { doctorService } from "../../services/doctorService";
import {
  DOCTOR_TITLE_OPTIONS,
  type CreateDoctorDto,
  type Doctor,
  type UpdateDoctorDto,
  type UpdateScheduleItem,
} from "../../types";

interface FormValues {
  title: string;
  name: string;
  branch: string;
  email: string;
  password: string;
}

interface Props {
  open: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onSubmit: (
    dto: CreateDoctorDto | UpdateDoctorDto,
    id?: number
  ) => Promise<void>;
  onScheduleUpdated?: () => void;
}

const TITLE_OPTIONS = DOCTOR_TITLE_OPTIONS.map((t) => ({ value: t, label: t }));

const DAYS: { day: number; label: string }[] = [
  { day: 1, label: "Pazartesi" },
  { day: 2, label: "Salı" },
  { day: 3, label: "Çarşamba" },
  { day: 4, label: "Perşembe" },
  { day: 5, label: "Cuma" },
  { day: 6, label: "Cumartesi" },
  { day: 7, label: "Pazar" },
];

interface DayRow {
  day: number;
  active: boolean;
  start: string;
  end: string;
}

const defaultScheduleRows = (): DayRow[] =>
  DAYS.map(({ day }) => ({
    day,
    active: day >= 1 && day <= 5,
    start: "08:00",
    end: "17:00",
  }));

const fromDoctorSchedules = (doctor: Doctor): DayRow[] => {
  const byDay = new Map(
    doctor.schedules.map((s) => [s.dayOfWeek, { start: s.startTime, end: s.endTime }])
  );
  return DAYS.map(({ day }) => {
    const found = byDay.get(day);
    return {
      day,
      active: !!found,
      start: found?.start ?? "08:00",
      end: found?.end ?? "17:00",
    };
  });
};

const isValidHm = (s: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

const minutesOf = (hm: string): number => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

export function DoctorFormModal({
  open,
  doctor,
  onClose,
  onSubmit,
  onScheduleUpdated,
}: Props) {
  const isEdit = !!doctor;
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();
  const [scheduleRows, setScheduleRows] = useState<DayRow[]>(defaultScheduleRows);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    reset({
      title: doctor?.title ?? "",
      name: doctor?.name ?? "",
      branch: doctor?.branch ?? "",
      email: doctor?.email ?? "",
      password: "",
    });
    setScheduleRows(doctor ? fromDoctorSchedules(doctor) : defaultScheduleRows());
    setScheduleError(null);
  }, [open, doctor, reset]);

  const validateSchedule = (): UpdateScheduleItem[] | null => {
    const active = scheduleRows.filter((r) => r.active);
    for (const row of active) {
      if (!isValidHm(row.start) || !isValidHm(row.end)) {
        setScheduleError(
          `${DAYS.find((d) => d.day === row.day)?.label}: Saat formatı HH:mm olmalı.`
        );
        return null;
      }
      if (minutesOf(row.start) >= minutesOf(row.end)) {
        setScheduleError(
          `${DAYS.find((d) => d.day === row.day)?.label}: Başlangıç saati bitişten önce olmalı.`
        );
        return null;
      }
    }
    setScheduleError(null);
    return active.map((r) => ({
      dayOfWeek: r.day,
      startTime: r.start,
      endTime: r.end,
    }));
  };

  const submit = handleSubmit(async (values) => {
    const base = {
      title: values.title ? values.title : null,
      name: values.name.trim(),
      branch: values.branch,
      email: values.email.trim(),
    };

    let schedulePayload: UpdateScheduleItem[] | null = null;
    if (isEdit) {
      schedulePayload = validateSchedule();
      if (schedulePayload === null) return;
    }

    if (isEdit) {
      await onSubmit(base as UpdateDoctorDto, doctor!.id);
      if (schedulePayload !== null) {
        setScheduleSaving(true);
        try {
          await doctorService.updateSchedule(doctor!.id, {
            schedules: schedulePayload,
          });
          toast.success("Mesai çizelgesi güncellendi.");
          onScheduleUpdated?.();
        } catch {
          /* interceptor */
        } finally {
          setScheduleSaving(false);
        }
      }
    } else {
      await onSubmit({ ...base, password: values.password } as CreateDoctorDto);
    }
  });

  const updateRow = (day: number, patch: Partial<DayRow>) => {
    setScheduleRows((rows) =>
      rows.map((r) => (r.day === day ? { ...r, ...patch } : r))
    );
  };

  const busy = isSubmitting || scheduleSaving;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Doktor Bilgilerini Düzenle" : "Yeni Doktor Ekle"}
      description={
        isEdit
          ? "Mevcut doktor kaydını güncelleyin."
          : "Yeni doktor kaydı oluşturun. Mesai çizelgesi oluşturduktan sonra düzenlenebilir."
      }
      size="lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
          <Controller
            control={control}
            name="title"
            render={({ field }) => (
              <Select
                label="Ünvan"
                value={field.value}
                onChange={field.onChange}
                options={TITLE_OPTIONS}
                placeholder="Seçiniz"
              />
            )}
          />
          <FormField
            label="Ad"
            error={errors.name?.message}
            {...register("name", {
              required: "Ad zorunludur.",
              maxLength: { value: 100, message: "En fazla 100 karakter." },
            })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            control={control}
            name="branch"
            rules={{ required: "Branş seçiniz." }}
            render={({ field }) => (
              <Select
                label="Branş"
                value={field.value}
                onChange={field.onChange}
                options={BRANCH_OPTIONS}
                placeholder="Branş seçiniz"
                error={errors.branch?.message}
              />
            )}
          />
          <FormField
            label="E-posta"
            type="email"
            error={errors.email?.message}
            {...register("email", {
              required: "E-posta zorunludur.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Geçerli bir e-posta giriniz.",
              },
            })}
          />
        </div>

        {!isEdit && (
          <FormField
            label="Şifre"
            type="password"
            placeholder="En az 10 karakter"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password", {
              required: "Şifre zorunludur.",
              minLength: { value: 10, message: "En az 10 karakter olmalıdır." },
            })}
          />
        )}

        {isEdit && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2.5 mt-2">
              <CalendarDays className="w-4 h-4 text-medical-600" />
              <h4 className="text-sm font-semibold text-slate-900">
                Mesai Çizelgesi
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Her gün için doktorun çalışma saatlerini ayarlayın. Mesai dışı saatlerde
              randevu oluşturulamaz.
            </p>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Gün</th>
                    <th className="text-center px-3 py-2 font-medium w-24">
                      Çalışıyor
                    </th>
                    <th className="text-left px-3 py-2 font-medium w-32">
                      Başlangıç
                    </th>
                    <th className="text-left px-3 py-2 font-medium w-32">Bitiş</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scheduleRows.map((row) => {
                    const dayLabel =
                      DAYS.find((d) => d.day === row.day)?.label ?? "";
                    return (
                      <tr key={row.day} className="bg-white">
                        <td className="px-3 py-2 text-slate-800">{dayLabel}</td>
                        <td className="px-3 py-2 text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={row.active}
                              onChange={(e) =>
                                updateRow(row.day, { active: e.target.checked })
                              }
                              className="w-4 h-4 rounded border-slate-300 text-medical-600 focus:ring-medical-500/30"
                            />
                          </label>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            value={row.start}
                            disabled={!row.active}
                            onChange={(e) =>
                              updateRow(row.day, { start: e.target.value })
                            }
                            className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white tabular-nums disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            value={row.end}
                            disabled={!row.active}
                            onChange={(e) =>
                              updateRow(row.day, { end: e.target.value })
                            }
                            className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-300 bg-white tabular-nums disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {scheduleError && (
              <p className="text-xs text-rose-600 mt-2">{scheduleError}</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button type="submit" loading={busy}>
            {isEdit ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
