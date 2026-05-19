import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { AppointmentStatus, AppointmentType, type Appointment } from "../../types";

interface Props {
  appointments: Appointment[];
  weekStart: Date;
  canCreate: boolean;
  onAppointmentClick: (appt: Appointment) => void;
  onSlotClick: (date: Date) => void;
}

const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 8; h <= 18; h++) {
    for (const m of [0, 30]) {
      if (h === 18 && m === 30) continue;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Bekliyor]:
    "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100",
  [AppointmentStatus.Geldi]:
    "bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100",
  [AppointmentStatus.MuayenedeAlindi]:
    "bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100",
  [AppointmentStatus.Tamamlandi]:
    "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100",
  [AppointmentStatus.IptalEdildi]:
    "bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 line-through opacity-80",
  [AppointmentStatus.Gelmedi]:
    "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 opacity-90",
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Bekliyor]: "bg-amber-500",
  [AppointmentStatus.Geldi]: "bg-blue-500",
  [AppointmentStatus.MuayenedeAlindi]: "bg-purple-500",
  [AppointmentStatus.Tamamlandi]: "bg-emerald-500",
  [AppointmentStatus.IptalEdildi]: "bg-rose-500",
  [AppointmentStatus.Gelmedi]: "bg-slate-400",
};

const slotKeyOf = (d: Date) => {
  const h = String(d.getHours()).padStart(2, "0");
  const m = d.getMinutes() < 30 ? "00" : "30";
  return `${h}:${m}`;
};

const dateKeyOf = (d: Date) => format(d, "yyyy-MM-dd");

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function AppointmentCalendar({
  appointments,
  weekStart,
  canCreate,
  onAppointmentClick,
  onSlotClick,
}: Props) {
  const days = useMemo(
    () => Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const [mobileDayIndex, setMobileDayIndex] = useState<number>(() => {
    const i = days.findIndex((d) => isSameDay(d, new Date()));
    return i >= 0 ? i : 0;
  });

  useEffect(() => {
    const i = days.findIndex((d) => isSameDay(d, new Date()));
    setMobileDayIndex(i >= 0 ? i : 0);
  }, [days]);

  const visibleDays = isDesktop ? days : [days[mobileDayIndex]];

  const bucket = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((a) => {
      const dt = new Date(a.dateTime);
      const key = `${dateKeyOf(dt)}|${slotKeyOf(dt)}`;
      const arr = map.get(key);
      if (arr) arr.push(a);
      else map.set(key, [a]);
    });
    return map;
  }, [appointments]);

  const desktopTemplate = "60px repeat(5, minmax(0, 1fr))";
  const mobileTemplate = "60px minmax(0, 1fr)";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {!isDesktop && (
        <div className="px-3 pt-3">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {days.map((d, i) => {
              const active = i === mobileDayIndex;
              const isToday = isSameDay(d, today);
              return (
                <button
                  key={i}
                  onClick={() => setMobileDayIndex(i)}
                  className={`
                    flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-medium shrink-0
                    transition-colors border
                    ${
                      active
                        ? "bg-medical-600 border-medical-600 text-white"
                        : isToday
                        ? "bg-medical-50 border-medical-200 text-medical-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }
                  `}
                >
                  <span className="uppercase text-[10px] tracking-wider">
                    {format(d, "EEE", { locale: tr })}
                  </span>
                  <span className="text-sm tabular-nums">{format(d, "dd")}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div
          className="min-w-full"
          style={{
            display: "grid",
            gridTemplateColumns: isDesktop ? desktopTemplate : mobileTemplate,
          }}
        >
          {/* Header row */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200" />
          {visibleDays.map((d, i) => {
            const isToday = isSameDay(d, today);
            return (
              <div
                key={`h-${i}`}
                className={`
                  sticky top-0 z-10 px-2 py-3 text-center border-b border-l border-slate-200
                  ${isToday ? "bg-medical-50/70" : "bg-white"}
                `}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider font-medium ${
                    isToday ? "text-medical-700" : "text-slate-500"
                  }`}
                >
                  {format(d, "EEEE", { locale: tr })}
                </div>
                <div
                  className={`mt-0.5 text-sm font-semibold tabular-nums ${
                    isToday ? "text-medical-700" : "text-slate-900"
                  }`}
                >
                  {format(d, "dd MMM", { locale: tr })}
                </div>
              </div>
            );
          })}

          {/* Time rows */}
          {TIME_SLOTS.map((slot) => (
            <SlotRow
              key={slot}
              slot={slot}
              days={visibleDays}
              bucket={bucket}
              today={today}
              canCreate={canCreate}
              onAppointmentClick={onAppointmentClick}
              onSlotClick={onSlotClick}
            />
          ))}
        </div>
      </div>

      <Legend />
    </div>
  );
}

function SlotRow({
  slot,
  days,
  bucket,
  today,
  canCreate,
  onAppointmentClick,
  onSlotClick,
}: {
  slot: string;
  days: Date[];
  bucket: Map<string, Appointment[]>;
  today: Date;
  canCreate: boolean;
  onAppointmentClick: (a: Appointment) => void;
  onSlotClick: (d: Date) => void;
}) {
  return (
    <>
      <div className="px-2 py-1.5 text-[11px] text-slate-500 tabular-nums text-right border-b border-slate-100 bg-slate-50/40">
        {slot}
      </div>
      {days.map((d, i) => {
        const isToday = isSameDay(d, today);
        const key = `${dateKeyOf(d)}|${slot}`;
        const items = bucket.get(key) ?? [];
        const [h, m] = slot.split(":").map(Number);
        const slotDate = new Date(d);
        slotDate.setHours(h, m, 0, 0);
        const isPast = slotDate < new Date();

        return (
          <div
            key={`c-${i}-${slot}`}
            className={`
              relative border-b border-l border-slate-100 min-h-[44px] p-0.5
              ${isToday ? "bg-medical-50/40" : "bg-white"}
              ${
                items.length === 0 && canCreate && !isPast
                  ? "hover:bg-medical-50/70 cursor-pointer group/cell"
                  : ""
              }
            `}
            onClick={() => {
              if (items.length > 0 || !canCreate || isPast) return;
              onSlotClick(slotDate);
            }}
          >
            {items.length === 0 && canCreate && !isPast && (
              <span
                className="absolute inset-0 flex items-center justify-center text-[11px] text-medical-500/0
                           group-hover/cell:text-medical-500 transition-colors pointer-events-none select-none"
              >
                + Yeni
              </span>
            )}

            {items.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                onClick={() => onAppointmentClick(a)}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

const TYPE_LABEL: Record<AppointmentType, string> = {
  [AppointmentType.Poliklinik]: "P",
  [AppointmentType.Kontrol]: "K",
  [AppointmentType.Acil]: "A",
};

const TYPE_PILL: Record<AppointmentType, string> = {
  [AppointmentType.Poliklinik]: "bg-sky-200 text-sky-900",
  [AppointmentType.Kontrol]: "bg-indigo-200 text-indigo-900",
  [AppointmentType.Acil]: "bg-red-200 text-red-900",
};

function AppointmentCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        block w-full text-left px-1.5 py-1 rounded-md border text-[11px]
        transition-colors mb-0.5 last:mb-0
        ${STATUS_STYLES[appointment.status]}
      `}
    >
      <div className="flex items-center gap-1">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
            STATUS_DOT[appointment.status]
          }`}
        />
        <span className="font-medium truncate flex-1">{appointment.patientFullName}</span>
        <span
          title={appointment.typeText}
          className={`shrink-0 inline-flex items-center justify-center w-3.5 h-3.5 rounded text-[9px] font-bold leading-none ${TYPE_PILL[appointment.type]}`}
        >
          {TYPE_LABEL[appointment.type]}
        </span>
      </div>
      <div className="text-[10px] opacity-80 truncate pl-2.5">
        {appointment.doctorName}
      </div>
    </button>
  );
}

function Legend() {
  return (
    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
      <LegendDot color="bg-amber-400" label="Bekliyor" />
      <LegendDot color="bg-blue-500" label="Geldi" />
      <LegendDot color="bg-purple-500" label="Muayenede" />
      <LegendDot color="bg-emerald-500" label="Tamamlandı" />
      <LegendDot color="bg-rose-500" label="İptal" />
      <LegendDot color="bg-slate-400" label="Gelmedi" />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
