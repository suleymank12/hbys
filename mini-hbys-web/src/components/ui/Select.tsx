import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  hint?: string;
}

interface Props {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Seçiniz",
  error,
  disabled,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div className={`block ${className}`} ref={ref}>
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </span>
      )}

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
        <span className={current ? "text-slate-900" : "text-slate-400"}>
          {current?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 py-1 max-h-60 overflow-y-auto animate-[modalIn_0.12s_ease-out]">
            {options.map((o) => {
              const isSelected = o.value === value;
              const isDisabled = !!o.disabled;
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`
                    w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2
                    transition-colors
                    ${
                      isDisabled
                        ? "text-slate-300 bg-slate-50/60 cursor-not-allowed line-through"
                        : isSelected
                        ? "bg-medical-50 text-medical-700 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span>{o.label}</span>
                    {o.hint && (
                      <span
                        className={`text-xs no-underline ${
                          isDisabled ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {o.hint}
                      </span>
                    )}
                  </span>
                  {isSelected && !isDisabled && (
                    <Check className="w-4 h-4 text-medical-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <span className="block text-xs text-rose-600 mt-1">{error}</span>}
    </div>
  );
}
