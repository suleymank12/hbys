import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SearchableOption {
  value: number | string;
  label: string;
  sublabel?: string;
}

interface Props {
  label?: string;
  value: number | string | null;
  onChange: (val: number | string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  emptyText?: string;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Seçiniz",
  searchPlaceholder = "Ara...",
  error,
  disabled,
  emptyText = "Sonuç bulunamadı.",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = options.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLocaleLowerCase("tr-TR").includes(q) ||
        (o.sublabel?.toLocaleLowerCase("tr-TR").includes(q) ?? false)
    );
  }, [options, query]);

  return (
    <div className="block" ref={ref}>
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
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
        <span className={current ? "text-slate-900 truncate" : "text-slate-400"}>
          {current ? (
            <>
              {current.label}
              {current.sublabel && (
                <span className="text-slate-500 ml-1.5">— {current.sublabel}</span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-slate-200 animate-[modalIn_0.12s_ease-out] overflow-hidden">
            <div className="px-2 pt-2 pb-1 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-2.5 py-1.5 text-sm rounded-md border border-slate-200 bg-slate-50
                             focus:outline-none focus:bg-white focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20
                             placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">
                  {emptyText}
                </div>
              ) : (
                filtered.map((o) => {
                  const isSelected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={`
                        w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2
                        transition-colors
                        ${
                          isSelected
                            ? "bg-medical-50 text-medical-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }
                      `}
                    >
                      <span className="truncate">
                        <span className={isSelected ? "font-medium" : ""}>{o.label}</span>
                        {o.sublabel && (
                          <span className="text-slate-500 ml-1.5">— {o.sublabel}</span>
                        )}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-medical-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {error && <span className="block text-xs text-rose-600 mt-1">{error}</span>}
    </div>
  );
}
