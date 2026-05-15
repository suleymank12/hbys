import { useEffect, useRef, useState } from "react";
import { Menu, Bell, UserCircle2, LogOut, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const titles: Record<string, string> = {
  "/": "Gösterge Paneli",
  "/patients": "Hastalar",
  "/doctors": "Doktorlar",
  "/appointments": "Randevular",
  "/medical-records": "Muayene Kayıtları",
  "/audit-logs": "Denetim Kayıtları",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title =
    titles[pathname] ||
    Object.entries(titles).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ||
    "Mini HBYS";

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Menüyü aç"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg lg:text-xl font-semibold text-slate-900 leading-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Hastane Bilgi Yönetim Sistemi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors relative"
            aria-label="Bildirimler"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="relative pl-3 ml-1 border-l border-slate-200" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 px-1.5 py-1 rounded-lg hover:bg-slate-50 transition-colors"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <UserCircle2 className="w-8 h-8 text-slate-400" />
              <div className="hidden sm:block leading-tight text-left">
                <div className="text-sm font-medium text-slate-900">
                  {user?.name ?? "Kullanıcı"}
                </div>
                <div className="text-xs text-slate-500">
                  {user?.roleText ?? "—"}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-lg ring-1 ring-slate-200 overflow-hidden z-30 animate-[fadeIn_0.15s_ease-out]"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {user?.name ?? "Kullanıcı"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email ?? ""}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-medical-50 text-medical-700">
                    {user?.roleText ?? "—"}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
