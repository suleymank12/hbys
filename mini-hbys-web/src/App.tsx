import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { PatientsPage } from "./pages/patients/PatientsPage";
import { DoctorsPage } from "./pages/doctors/DoctorsPage";
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { MedicalRecordsPage } from "./pages/medical-records/MedicalRecordsPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: 14 },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="medical-records" element={<MedicalRecordsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
