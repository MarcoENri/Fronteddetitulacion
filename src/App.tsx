import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminStudentsByCareerPage from "./pages/AdminStudentsByCareerPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import CoordinatorStudentsPage from "./pages/CoordinatorStudentsPage";
import CoordinatorStudentDetailPage from "./pages/CoordinatorStudentDetailPage";
import TutorStudentsPage from "./pages/TutorStudentsPage";
import TutorStudentDetailPage from "./pages/TutorStudentDetailPage";
import { api } from "./api/api";

type MeDto = { username: string; roles: string[] };

/* ===================== PROTECCIÓN DE RUTAS ===================== */

function RequireRole({
  children,
  role,
}: {
  children: ReactNode;
  role: "ROLE_ADMIN" | "ROLE_COORDINATOR" | "ROLE_TUTOR";
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

  const roles = me?.roles ?? [];
  return roles.includes(role) ? <>{children}</> : <Navigate to="/" replace />;
}

/* ===================== REDIRECCIÓN INICIAL ===================== */

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

  const roles = me?.roles ?? [];
  if (roles.includes("ROLE_ADMIN")) return <Navigate to="/admin" replace />;
  if (roles.includes("ROLE_COORDINATOR")) return <Navigate to="/coordinator" replace />;
  if (roles.includes("ROLE_TUTOR")) return <Navigate to="/tutor" replace />;

  localStorage.clear(); 
  return <LoginPage />;
}

/* ===================== COMPONENTE APP ===================== */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/admin" element={
          <RequireRole role="ROLE_ADMIN"><AdminStudentsPage /></RequireRole>
        } />
        
        <Route path="/admin/students/career/:careerName" element={
          <RequireRole role="ROLE_ADMIN"><AdminStudentsByCareerPage /></RequireRole>
        } />

        <Route path="/admin/students/:id" element={
          <RequireRole role="ROLE_ADMIN"><StudentDetailPage /></RequireRole>
        } />

        <Route path="/coordinator" element={
          <RequireRole role="ROLE_COORDINATOR"><CoordinatorStudentsPage /></RequireRole>
        } />
        <Route path="/coordinator/students/:id" element={
          <RequireRole role="ROLE_COORDINATOR"><CoordinatorStudentDetailPage /></RequireRole>
        } />

        <Route path="/tutor" element={
          <RequireRole role="ROLE_TUTOR"><TutorStudentsPage /></RequireRole>
        } />
        <Route path="/tutor/students/:id" element={
          <RequireRole role="ROLE_TUTOR"><TutorStudentDetailPage /></RequireRole>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}