import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import LoginPage from "./pages/LoginPage";
import AdminStudentsPage from "./pages/AdminStudentsPage";
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

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminStudentsPage />
            </RequireAuth>
          }
        />

        {/* ✅ ESTA ES LA QUE TE FALTA */}
        <Route
          path="/admin/students/:id"
          element={
            <RequireAuth>
              <StudentDetailPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
