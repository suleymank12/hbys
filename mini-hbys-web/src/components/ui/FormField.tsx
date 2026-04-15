import type { InputHTMLAttributes, ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function FormField({ label, error, hint, className = "", ...rest }: Props) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      <input
        {...rest}
        className={`
          w-full px-3 py-2 text-sm rounded-lg border bg-white
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
          transition-colors
          ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/30" : "border-slate-300"}
        `}
      />
      {error && <span className="block text-xs text-rose-600 mt-1">{error}</span>}
      {!error && hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}
