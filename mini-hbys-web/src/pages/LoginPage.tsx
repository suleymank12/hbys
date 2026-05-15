import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { HeartPulse, Mail, Lock, ShieldCheck, Activity, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { LoginDto } from "../types";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDto>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      const redirectTo =
        (location.state as { from?: string } | null)?.from ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        "Giriş yapılamadı. Bilgilerinizi kontrol edin.";
      setServerError(message);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-medical-50/40 to-medical-100/60 flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-medical-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-medical-300/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 rounded-2xl bg-white shadow-2xl shadow-medical-900/10 overflow-hidden ring-1 ring-slate-200">
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-medical-600 via-medical-700 to-medical-900 p-10 text-white relative">
          <div className="absolute inset-0 opacity-10" aria-hidden>
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/30 blur-2xl" />
            <div className="absolute bottom-20 right-8 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
          </div>

          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/30">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">Mini HBYS</div>
              <div className="text-xs text-white/75 leading-tight">
                Hastane Bilgi Yönetim Sistemi
              </div>
            </div>
          </div>

          <div className="relative space-y-6 mt-12">
            <h2 className="text-3xl font-bold leading-tight">
              Hasta bakımına odaklanın,
              <br /> gerisini biz halledelim.
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Hasta kayıtları, randevular ve muayene notlarınızı tek bir yerden,
              güvenli ve hızlı şekilde yönetin.
            </p>

            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-medical-200 mt-0.5 shrink-0" />
                <span className="text-white/90">
                  Rol bazlı erişim — Yönetici, Doktor ve Sekreter için ayrı yetkiler.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-medical-200 mt-0.5 shrink-0" />
                <span className="text-white/90">
                  Anlık dashboard, randevu takibi ve muayene arşivi.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-medical-200 mt-0.5 shrink-0" />
                <span className="text-white/90">
                  JWT tabanlı oturum yönetimi ile uçtan uca güvenli.
                </span>
              </li>
            </ul>
          </div>

          <div className="relative text-xs text-white/60">
            © 2026 Mini HBYS · Tüm hakları saklıdır
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-500 to-medical-700 flex items-center justify-center shadow-sm">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">Mini HBYS</div>
              <div className="text-xs text-slate-500 leading-tight">
                Hastane Bilgi Yönetim Sistemi
              </div>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Tekrar hoş geldiniz
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Devam etmek için hesap bilgilerinizi girin.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@minihbys.com"
                  className={`
                    w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border bg-white
                    placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
                    transition-colors
                    ${
                      errors.email
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/30"
                        : "border-slate-300"
                    }
                  `}
                  {...register("email", {
                    required: "E-posta zorunludur.",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Geçerli bir e-posta giriniz.",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <span className="block text-xs text-rose-600 mt-1">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`
                    w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border bg-white
                    placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500
                    transition-colors
                    ${
                      errors.password
                        ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/30"
                        : "border-slate-300"
                    }
                  `}
                  {...register("password", {
                    required: "Şifre zorunludur.",
                  })}
                />
              </div>
              {errors.password && (
                <span className="block text-xs text-rose-600 mt-1">
                  {errors.password.message}
                </span>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{serverError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full inline-flex items-center justify-center gap-2 rounded-lg
                bg-medical-600 hover:bg-medical-700 active:bg-medical-800
                disabled:bg-medical-300 disabled:cursor-not-allowed
                text-white font-medium text-sm py-2.5
                shadow-sm transition-all
                focus:outline-none focus:ring-2 focus:ring-medical-500/40 focus:ring-offset-1
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>

          <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 leading-relaxed">
            <div className="font-medium text-slate-700 mb-1.5">
              Demo hesaplar
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-3">
              <span className="text-slate-500">Yönetici</span>
              <span className="font-mono">admin@minihbys.com / Admin123!</span>
              <span className="text-slate-500">Sekreter</span>
              <span className="font-mono">sekreter@minihbys.com / Sekreter123!</span>
              <span className="text-slate-500">Doktor</span>
              <span className="font-mono">ahmet.yilmaz@minihbys.com / Doctor123!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
