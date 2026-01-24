import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { api } from "./api/api";

// Pages
import LoginPage from "./pages/LoginPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminStudentsByCareerPage from "./pages/AdminStudentsByCareerPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import CoordinatorStudentsPage from "./pages/CoordinatorStudentsPage";
import CoordinatorStudentDetailPage from "./pages/CoordinatorStudentDetailPage";
import TutorStudentsPage from "./pages/TutorStudentsPage";
import TutorStudentDetailPage from "./pages/TutorStudentDetailPage";

// ✅ PREDEFENSA
import AdminPredefensePage from "./pages/AdminPredefensePage";
import JuryPredefensePage from "./pages/JuryPredefensePage";

// ✅ DEFENSA FINAL (NUEVO)
import FinalDefenseAdminPage from "./pages/FinalDefenseAdminPage";
import FinalDefenseJuryPage from "./pages/FinalDefenseJuryPage";

type MeDto = { username: string; roles: string[] };

/**
 * Función auxiliar para estandarizar roles.
 */
const normalizeRoles = (roles: string[]) => {
  return roles.map((r) => (r.startsWith("ROLE_") ? r : `ROLE_${r}`));
};

function RequireRole({
  children,
  role,
}: {
  children: ReactNode;
  role: "ROLE_ADMIN" | "ROLE_COORDINATOR" | "ROLE_TUTOR" | "ROLE_JURY";
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
      } catch (err: any) {
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
  return roles.includes(role) ? <>{children}</> : <Navigate to="/" replace />;
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
      } catch (err: any) {
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
  
  // ✅ Redirección para JURY (Por defecto va a predefensa, luego navegan por menú)
  if (roles.includes("ROLE_JURY")) return <Navigate to="/jury/predefense" replace />;

  localStorage.clear();
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {/* --- RUTAS DE ADMIN --- */}
        <Route
          path="/admin"
          element={
            <RequireRole role="ROLE_ADMIN">
              <AdminStudentsPage />
            </RequireRole>
          }
        />
        
        {/* ✅ CORREGIDO: Ruta para estudiantes por carrera usando Query Params */}
        {/* Antes era /admin/students/career/:careerName, ahora es /admin/students/by-career */}
        <Route
          path="/admin/students/by-career"
          element={
            <RequireRole role="ROLE_ADMIN">
              <AdminStudentsByCareerPage />
            </RequireRole>
          }
        />

        <Route
          path="/admin/students/:id"
          element={
            <RequireRole role="ROLE_ADMIN">
              <StudentDetailPage />
            </RequireRole>
          }
        />
        {/* Predefensa Admin */}
        <Route
          path="/admin/predefense"
          element={
            <RequireRole role="ROLE_ADMIN">
              <AdminPredefensePage />
            </RequireRole>
          }
        />
        {/* ✅ DEFENSA FINAL ADMIN */}
        <Route
          path="/admin/final-defense"
          element={
            <RequireRole role="ROLE_ADMIN">
              <FinalDefenseAdminPage />
            </RequireRole>
          }
        />

        {/* --- RUTAS DE COORDINADOR --- */}
        <Route
          path="/coordinator"
          element={
            <RequireRole role="ROLE_COORDINATOR">
              <CoordinatorStudentsPage />
            </RequireRole>
          }
        />
        <Route
          path="/coordinator/students/:id"
          element={
            <RequireRole role="ROLE_COORDINATOR">
              <CoordinatorStudentDetailPage />
            </RequireRole>
          }
        />

        {/* --- RUTAS DE TUTOR --- */}
        <Route
          path="/tutor"
          element={
            <RequireRole role="ROLE_TUTOR">
              <TutorStudentsPage />
            </RequireRole>
          }
        />
        <Route
          path="/tutor/students/:id"
          element={
            <RequireRole role="ROLE_TUTOR">
              <TutorStudentDetailPage />
            </RequireRole>
          }
        />

        {/* --- RUTAS DE JURADO --- */}
        {/* Predefensa Jurado */}
        <Route
          path="/jury/predefense"
          element={
            <RequireRole role="ROLE_JURY">
              <JuryPredefensePage />
            </RequireRole>
          }
        />
        {/* ✅ DEFENSA FINAL JURADO */}
        <Route 
          path="/jury/final-defense" 
          element={
            <RequireRole role="ROLE_JURY">
              <FinalDefenseJuryPage />
            </RequireRole>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}