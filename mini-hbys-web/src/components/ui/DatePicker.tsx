import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
  placeholder?: string;
  isDateDisabled?: (date: Date) => boolean;
}

type View = "days" | "months" | "years";

const WEEKDAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

const YEARS_PER_PAGE = 12;

export function DatePicker({
  label,
  value,
  onChange,
  error,
  disabled,
  maxDate,
  minDate,
  placeholder = "Tarih seçiniz",
  isDateDisabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("days");
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = value ? startOfDay(new Date(value)) : undefined;
  const [viewMonth, setViewMonth] = useState<Date>(
    selected ?? startOfMonth(maxDate ?? new Date())
  );
  const [yearPageStart, setYearPageStart] = useState<number>(() => {
    const y = (selected ?? new Date()).getFullYear();
    return y - (y % YEARS_PER_PAGE);
  });

  useEffect(() => {
    if (open) {
      setView("days");
      if (selected) {
        setViewMonth(startOfMonth(selected));
        const y = selected.getFullYear();
        setYearPageStart(y - (y % YEARS_PER_PAGE));
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const lowerBound = minDate ? startOfDay(minDate) : undefined;
  const upperBound = maxDate ? startOfDay(maxDate) : undefined;

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [viewMonth]);

  const isDayDisabled = (d: Date) =>
    Boolean(
      (lowerBound && isBefore(d, lowerBound)) ||
        (upperBound && isAfter(d, upperBound)) ||
        isDateDisabled?.(d)
    );

  const isMonthDisabled = (monthIdx: number) => {
    const first = startOfMonth(new Date(viewMonth.getFullYear(), monthIdx, 1));
    const last = endOfMonth(first);
    if (upperBound && isBefore(upperBound, first)) return true;
    if (lowerBound && isAfter(lowerBound, last)) return true;
    return false;
  };

  const isYearDisabled = (year: number) => {
    if (upperBound && year > upperBound.getFullYear()) return true;
    if (lowerBound && year < lowerBound.getFullYear()) return true;
    return false;
  };

  const canPrevMonth =
    !lowerBound || !isBefore(startOfMonth(viewMonth), addMonths(lowerBound, 1));
  const canNextMonth =
    !upperBound || isBefore(endOfMonth(viewMonth), upperBound);

  const canPrevYearPage =
    !lowerBound || yearPageStart > lowerBound.getFullYear();
  const canNextYearPage =
    !upperBound || yearPageStart + YEARS_PER_PAGE - 1 < upperBound.getFullYear();

  const pickDay = (d: Date) => {
    if (isDayDisabled(d)) return;
    onChange(format(d, "yyyy-MM-dd"));
    setOpen(false);
  };

  const pickMonth = (idx: number) => {
    if (isMonthDisabled(idx)) return;
    setViewMonth(new Date(viewMonth.getFullYear(), idx, 1));
    setView("days");
  };

  const pickYear = (y: number) => {
    if (isYearDisabled(y)) return;
    setViewMonth(new Date(y, viewMonth.getMonth(), 1));
    setView("months");
  };

  return (
    <div className="block" ref={wrapRef}>
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full px-3 py-2 text-sm rounded-lg border bg-white text-left
          flex items-center justify-between gap-2
          transition-colors focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/30" : "border-slate-300"}
        `}
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>
          {selected ? format(selected, "dd MMMM yyyy", { locale: tr }) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="relative">
          <div
            className="absolute z-50 mt-2 w-[320px] bg-white rounded-xl shadow-lg border border-slate-200 p-4 animate-[modalIn_0.15s_ease-out]"
          >
            {view === "days" && (
              <>
                <Header
                  leftDisabled={!canPrevMonth}
                  rightDisabled={!canNextMonth}
                  onLeft={() => setViewMonth((m) => subMonths(m, 1))}
                  onRight={() => setViewMonth((m) => addMonths(m, 1))}
                >
                  <button
                    type="button"
                    onClick={() => setView("months")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors font-semibold text-slate-900"
                  >
                    {format(viewMonth, "LLLL", { locale: tr })}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const y = viewMonth.getFullYear();
                      setYearPageStart(y - (y % YEARS_PER_PAGE));
                      setView("years");
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors font-semibold text-slate-900 tabular-nums"
                  >
                    {viewMonth.getFullYear()}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </Header>

                <div className="grid grid-cols-7 gap-0.5 mb-1 animate-[fadeIn_0.15s_ease-out]">
                  {WEEKDAYS.map((w) => (
                    <div
                      key={w}
                      className="h-7 text-[11px] font-medium text-slate-400 uppercase flex items-center justify-center"
                    >
                      {w}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5 animate-[fadeIn_0.15s_ease-out]">
                  {days.map((d) => {
                    const outside = !isSameMonth(d, viewMonth);
                    const dayDisabled = isDayDisabled(d);
                    const isSel = !!selected && isSameDay(d, selected);
                    const today = isToday(d);

                    return (
                      <button
                        key={d.toISOString()}
                        type="button"
                        disabled={dayDisabled}
                        onClick={() => pickDay(d)}
                        className={`
                          relative h-9 w-9 mx-auto text-sm rounded-full transition-colors
                          focus:outline-none focus:ring-2 focus:ring-medical-500/30
                          ${
                            isSel
                              ? "bg-medical-600 text-white hover:bg-medical-700 font-semibold"
                              : dayDisabled
                              ? "text-slate-300 cursor-not-allowed"
                              : outside
                              ? "text-slate-300 hover:bg-slate-50"
                              : "text-slate-700 hover:bg-medical-50 hover:text-medical-700"
                          }
                        `}
                      >
                        <span className={today && !isSel ? "font-semibold text-medical-600" : ""}>
                          {d.getDate()}
                        </span>
                        {today && (
                          <span
                            className={`
                              absolute left-1/2 -translate-x-1/2 bottom-1 w-1 h-1 rounded-full
                              ${isSel ? "bg-white" : "bg-medical-500"}
                            `}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === "months" && (
              <>
                <Header
                  leftDisabled={!lowerBound ? false : viewMonth.getFullYear() <= lowerBound.getFullYear()}
                  rightDisabled={!upperBound ? false : viewMonth.getFullYear() >= upperBound.getFullYear()}
                  onLeft={() => setViewMonth((m) => addYears(m, -1))}
                  onRight={() => setViewMonth((m) => addYears(m, 1))}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const y = viewMonth.getFullYear();
                      setYearPageStart(y - (y % YEARS_PER_PAGE));
                      setView("years");
                    }}
                    className="px-3 py-1 rounded-md hover:bg-slate-100 transition-colors font-semibold text-slate-900 tabular-nums"
                  >
                    {viewMonth.getFullYear()}
                  </button>
                </Header>

                <div className="grid grid-cols-3 grid-rows-4 gap-2 animate-[fadeIn_0.15s_ease-out]">
                  {MONTHS_SHORT.map((m, idx) => {
                    const isSel =
                      selected &&
                      selected.getFullYear() === viewMonth.getFullYear() &&
                      selected.getMonth() === idx;
                    const isCur = viewMonth.getMonth() === idx;
                    const isDisabled = isMonthDisabled(idx);
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => pickMonth(idx)}
                        className={`
                          py-3 text-sm font-medium rounded-lg transition-colors
                          focus:outline-none focus:ring-2 focus:ring-medical-500/30
                          ${
                            isSel
                              ? "bg-medical-600 text-white hover:bg-medical-700"
                              : isDisabled
                              ? "text-slate-300 cursor-not-allowed"
                              : isCur
                              ? "bg-medical-50 text-medical-700 hover:bg-medical-100"
                              : "text-slate-700 hover:bg-medical-50 hover:text-medical-700"
                          }
                        `}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === "years" && (
              <>
                <Header
                  leftDisabled={!canPrevYearPage}
                  rightDisabled={!canNextYearPage}
                  onLeft={() => setYearPageStart((s) => s - YEARS_PER_PAGE)}
                  onRight={() => setYearPageStart((s) => s + YEARS_PER_PAGE)}
                >
                  <span className="px-3 py-1 font-semibold text-slate-900 tabular-nums">
                    {yearPageStart} – {yearPageStart + YEARS_PER_PAGE - 1}
                  </span>
                </Header>

                <div className="grid grid-cols-4 grid-rows-3 gap-2 animate-[fadeIn_0.15s_ease-out]">
                  {Array.from({ length: YEARS_PER_PAGE }).map((_, i) => {
                    const y = yearPageStart + i;
                    const isSel = selected?.getFullYear() === y;
                    const isCur = viewMonth.getFullYear() === y;
                    const isDisabled = isYearDisabled(y);
                    return (
                      <button
                        key={y}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => pickYear(y)}
                        className={`
                          py-3 text-sm font-medium rounded-lg transition-colors tabular-nums
                          focus:outline-none focus:ring-2 focus:ring-medical-500/30
                          ${
                            isSel
                              ? "bg-medical-600 text-white hover:bg-medical-700"
                              : isDisabled
                              ? "text-slate-300 cursor-not-allowed"
                              : isCur
                              ? "bg-medical-50 text-medical-700 hover:bg-medical-100"
                              : "text-slate-700 hover:bg-medical-50 hover:text-medical-700"
                          }
                        `}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && <span className="block text-xs text-rose-600 mt-1">{error}</span>}
    </div>
  );
}

function Header({
  children,
  leftDisabled,
  rightDisabled,
  onLeft,
  onRight,
}: {
  children: React.ReactNode;
  leftDisabled?: boolean;
  rightDisabled?: boolean;
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <button
        type="button"
        disabled={leftDisabled}
        onClick={onLeft}
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Önceki"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-1 text-sm">{children}</div>
      <button
        type="button"
        disabled={rightDisabled}
        onClick={onRight}
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Sonraki"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
