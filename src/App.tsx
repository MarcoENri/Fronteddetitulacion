import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import LoginPage from "./pages/LoginPage";

// ADMIN
import AdminStudentsPage from "./pages/AdminStudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";

// COORDINATOR
import CoordinatorStudentsPage from "./pages/CoordinatorStudentsPage";
import CoordinatorStudentDetailPage from "./pages/CoordinatorStudentDetailPage";

import { api } from "./api/api";

type MeDto = { username: string; roles: string[] };

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
      } catch {
        localStorage.removeItem("token");
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
        localStorage.removeItem("token");
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

  localStorage.removeItem("token");
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <RequireRole role="ROLE_ADMIN">
              <AdminStudentsPage />
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

        {/* COORDINATOR */}
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
