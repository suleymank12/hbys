import { Menu, Bell, UserCircle2 } from "lucide-react";
import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/": "Gösterge Paneli",
  "/patients": "Hastalar",
  "/doctors": "Doktorlar",
  "/appointments": "Randevular",
  "/medical-records": "Muayene Kayıtları",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const title =
    titles[pathname] ||
    Object.entries(titles).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ||
    "Mini HBYS";

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
          <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200">
            <UserCircle2 className="w-8 h-8 text-slate-400" />
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-medium text-slate-900">Yönetici</div>
              <div className="text-xs text-slate-500">admin@minihbys.com</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
