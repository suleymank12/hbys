import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { PatientsPage } from "./pages/patients/PatientsPage";
import { DoctorsPage } from "./pages/doctors/DoctorsPage";
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { MedicalRecordsPage } from "./pages/medical-records/MedicalRecordsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { LoginPage } from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import type { UserRoleName } from "./types";
import type { ReactNode } from "react";

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-2 border-medical-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm">Yükleniyor...</div>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function RequireRole({
  roles,
  children,
}: {
  roles: UserRoleName[];
  children: ReactNode;
}) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: 14 },
          }}
        />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            }
          />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route
              path="doctors"
              element={
                <RequireRole roles={["Admin", "Sekreter"]}>
                  <DoctorsPage />
                </RequireRole>
              }
            />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route
              path="medical-records"
              element={
                <RequireRole roles={["Admin", "Doktor"]}>
                  <MedicalRecordsPage />
                </RequireRole>
              }
            />
            <Route
              path="audit-logs"
              element={
                <RequireRole roles={["Admin"]}>
                  <AuditLogsPage />
                </RequireRole>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
