import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  ShieldCheck,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { UserRoleName } from "../../types";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
  roles: UserRoleName[];
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Gösterge Paneli",
    icon: LayoutDashboard,
    end: true,
    roles: ["Admin", "Doktor", "Sekreter"],
  },
  {
    to: "/patients",
    label: "Hastalar",
    icon: Users,
    roles: ["Admin", "Doktor", "Sekreter"],
  },
  {
    to: "/doctors",
    label: "Doktorlar",
    icon: Stethoscope,
    roles: ["Admin", "Sekreter"],
  },
  {
    to: "/appointments",
    label: "Randevular",
    icon: CalendarDays,
    roles: ["Admin", "Doktor", "Sekreter"],
  },
  {
    to: "/medical-records",
    label: "Muayene Kayıtları",
    icon: ClipboardList,
    roles: ["Admin", "Doktor"],
  },
  {
    to: "/audit-logs",
    label: "Denetim Kayıtları",
    icon: ShieldCheck,
    roles: ["Admin"],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { hasRole } = useAuth();
  const visibleItems = navItems.filter((item) => hasRole(...item.roles));

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0
          bg-white border-r border-slate-200 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-medical-500 to-medical-700 flex items-center justify-center shadow-sm">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">MediCore HBYS</div>
              <div className="text-xs text-slate-500 leading-tight">Hastane Sistemi</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-slate-900 transition-colors"
            aria-label="Menüyü kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  isActive
                    ? "bg-medical-50 text-medical-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-medical-600" : "text-slate-400"
                    }`}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-medical-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-slate-100 text-center">
          <div className="text-xs text-slate-400">© 2026 MediCore HBYS</div>
          <div className="text-[11px] text-slate-300 mt-0.5">v1.0.0</div>
        </div>
      </aside>
    </>
  );
}
