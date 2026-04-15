import { Check, Clock, X } from "lucide-react";
import { AppointmentStatus } from "../../types";

const META = {
  [AppointmentStatus.Bekliyor]: {
    text: "Bekliyor",
    cls: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200/60",
    icon: Clock,
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
