import {
  Check,
  Clock,
  LogIn,
  Stethoscope,
  UserX,
  X,
} from "lucide-react";
import { AppointmentStatus, AppointmentType } from "../../types";

const META = {
  [AppointmentStatus.Bekliyor]: {
    text: "Bekliyor",
    cls: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200/60",
    icon: Clock,
  },
  [AppointmentStatus.Geldi]: {
    text: "Geldi",
    cls: "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200/60",
    icon: LogIn,
  },
  [AppointmentStatus.MuayenedeAlindi]: {
    text: "Muayenede",
    cls: "bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200/60",
    icon: Stethoscope,
  },
  [AppointmentStatus.Tamamlandi]: {
    text: "Tamamlandı",
    cls: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200/60",
    icon: Check,
  },
  [AppointmentStatus.IptalEdildi]: {
    text: "İptal Edildi",
    cls: "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200/60",
    icon: X,
  },
  [AppointmentStatus.Gelmedi]: {
    text: "Gelmedi",
    cls: "bg-slate-200 text-slate-700 ring-1 ring-inset ring-slate-300/60",
    icon: UserX,
  },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const m = META[status];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${m.cls}`}
    >
      <Icon className="w-3 h-3" />
      {m.text}
    </span>
  );
}

const TYPE_META: Record<AppointmentType, { text: string; cls: string }> = {
  [AppointmentType.Poliklinik]: {
    text: "Poliklinik",
    cls: "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200/60",
  },
  [AppointmentType.Kontrol]: {
    text: "Kontrol",
    cls: "bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-200/60",
  },
  [AppointmentType.Acil]: {
    text: "Acil",
    cls: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200/60",
  },
};

export function AppointmentTypeBadge({ type }: { type: AppointmentType }) {
  const m = TYPE_META[type];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${m.cls}`}
    >
      {m.text}
    </span>
  );
}
