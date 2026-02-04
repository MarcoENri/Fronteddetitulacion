import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { api } from "./api/api";

// Pages
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminStudentsByCareerPage from "./pages/AdminStudentsByCareerPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import CoordinatorStudentsPage from "./pages/CoordinatorStudentsPage";
import CoordinatorStudentDetailPage from "./pages/CoordinatorStudentDetailPage";
import TutorStudentsPage from "./pages/TutorStudentsPage";
import TutorStudentDetailPage from "./pages/TutorStudentDetailPage";

// Predefensa
import AdminPredefensePage from "./pages/AdminPredefensePage";
import JuryPredefensePage from "./pages/JuryPredefensePage";

// Defensa Final
import FinalDefenseAdminPage from "./pages/FinalDefenseAdminPage";
import FinalDefenseJuryPage from "./pages/FinalDefenseJuryPage";

type MeDto = { username: string; roles: string[] };

const normalizeRoles = (roles: string[]) =>
  roles.map((r) => (r.startsWith("ROLE_") ? r : `ROLE_${r}`));

// ✅ COMPONENTE UNIFICADO: Acepta un array de roles permitidos
function RequireRole({
  children,
  rolesAllowed,
}: {
  children: ReactNode;
  rolesAllowed: Array<
    "ROLE_ADMIN" | "ROLE_COORDINATOR" | "ROLE_TUTOR" | "ROLE_JURY"
  >;
}) {
  const token = localStorage.getItem("token");
  const [me, setMe] = useState<MeDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await api.get<MeDto>("/me");
        setMe(res.data);
      } catch {
        localStorage.clear();
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (!token) return <Navigate to="/" replace />;
  if (loading) return null;

  const roles = normalizeRoles(me?.roles ?? []);

  // Verificar si tiene ALGUNO de los roles permitidos
  const allowed = rolesAllowed.some((r) => roles.includes(r));

  return allowed ? <>{children}</> : <Navigate to="/" replace />;
}

function HomeRedirect() {
  const token = localStorage.getItem("token");
  const [me, setMe] = useState<MeDto | null>(null);
  const [loading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await api.get<MeDto>("/me");
        setMe(res.data);
      } catch {
        localStorage.clear();
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (!token) return <LoginPage />;
  if (loading) return null;

  const roles = normalizeRoles(me?.roles ?? []);

  if (roles.includes("ROLE_ADMIN")) return <Navigate to="/admin" replace />;
  if (roles.includes("ROLE_COORDINATOR")) return <Navigate to="/coordinator" replace />;
  if (roles.includes("ROLE_TUTOR")) return <Navigate to="/tutor" replace />;
  if (roles.includes("ROLE_JURY")) return <Navigate to="/jury/predefense" replace />;

  localStorage.clear();
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ADMIN */}
        <Route 
          path="/admin" 
          element={<RequireRole rolesAllowed={["ROLE_ADMIN"]}><AdminStudentsPage /></RequireRole>} 
        />
        <Route 
          path="/admin/students/by-career" 
          element={<RequireRole rolesAllowed={["ROLE_ADMIN"]}><AdminStudentsByCareerPage /></RequireRole>} 
        />
        <Route 
          path="/admin/students/:id" 
          element={<RequireRole rolesAllowed={["ROLE_ADMIN"]}><StudentDetailPage /></RequireRole>} 
        />
        <Route 
          path="/admin/predefense" 
          element={<RequireRole rolesAllowed={["ROLE_ADMIN"]}><AdminPredefensePage /></RequireRole>} 
        />
        <Route 
          path="/admin/final-defense" 
          element={<RequireRole rolesAllowed={["ROLE_ADMIN"]}><FinalDefenseAdminPage /></RequireRole>} 
        />

        {/* COORDINADOR */}
        <Route 
          path="/coordinator" 
          element={<RequireRole rolesAllowed={["ROLE_COORDINATOR"]}><CoordinatorStudentsPage /></RequireRole>} 
        />
        <Route 
          path="/coordinator/students/:id" 
          element={<RequireRole rolesAllowed={["ROLE_COORDINATOR"]}><CoordinatorStudentDetailPage /></RequireRole>} 
        />

        {/* TUTOR */}
        <Route 
          path="/tutor" 
          element={<RequireRole rolesAllowed={["ROLE_TUTOR"]}><TutorStudentsPage /></RequireRole>} 
        />
        <Route 
          path="/tutor/students/:id" 
          element={<RequireRole rolesAllowed={["ROLE_TUTOR"]}><TutorStudentDetailPage /></RequireRole>} 
        />

        {/* JURADO - PREDEFENSA (Generalmente solo jurados puros, pero ajustable) */}
        <Route
          path="/jury/predefense"
          element={
            <RequireRole rolesAllowed={["ROLE_JURY", "ROLE_COORDINATOR", "ROLE_TUTOR"]}>
              <JuryPredefensePage />
            </RequireRole>
          }
        />

        {/* JURADO - DEFENSA FINAL (Acepta Jurado, Coordinador y Tutor) */}
        <Route
          path="/jury/final-defense"
          element={
            <RequireRole rolesAllowed={["ROLE_JURY", "ROLE_COORDINATOR", "ROLE_TUTOR"]}>
              <FinalDefenseJuryPage />
            </RequireRole>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}