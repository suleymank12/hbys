import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: "blue" | "emerald" | "amber" | "rose";
}

const accents = {
  blue:    { bg: "bg-medical-50",  fg: "text-medical-600",  ring: "ring-medical-100"  },
  emerald: { bg: "bg-emerald-50",  fg: "text-emerald-600",  ring: "ring-emerald-100"  },
  amber:   { bg: "bg-amber-50",    fg: "text-amber-600",    ring: "ring-amber-100"    },
  rose:    { bg: "bg-rose-50",     fg: "text-rose-600",     ring: "ring-rose-100"     },
};

export function StatCard({ label, value, icon: Icon, accent = "blue" }: StatCardProps) {
  const a = accents[accent];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{label}</div>
          <div className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">
            {value}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-lg ${a.bg} ${a.fg} flex items-center justify-center ring-4 ${a.ring}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
          <div className="h-8 w-16 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="w-12 h-12 rounded-lg bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}
