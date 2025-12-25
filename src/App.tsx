import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import LoginPage from "./pages/LoginPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminStudentsByCareerPage from "./pages/AdminStudentsByCareerPage";
import StudentDetailPage from "./pages/StudentDetailPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* ✅ Puedes redirigir /admin a /admin/students */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <Navigate to="/admin/students" replace />
            </RequireAuth>
          }
        />

        {/* ✅ Vista principal: 9 tarjetas de carreras */}
        <Route
          path="/admin/students"
          element={
            <RequireAuth>
              <AdminStudentsPage />
            </RequireAuth>
          }
        />

        {/* ✅ NUEVA VISTA: estudiantes por carrera (click en tarjeta) */}
        <Route
          path="/admin/students/career/:careerName"
          element={
            <RequireAuth>
              <AdminStudentsByCareerPage />
            </RequireAuth>
          }
        />

        {/* ✅ Detalle del estudiante */}
        <Route
          path="/admin/students/:id"
          element={
            <RequireAuth>
              <StudentDetailPage />
            </RequireAuth>
          }
        />

        {/* (Opcional) ruta fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
