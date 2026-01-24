import { api } from "../api/api";

type LoginResponse = { token: string };

export async function login(username: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/login", { username, password });
  localStorage.setItem("token", res.data.token);
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  // NO uses localStorage.clear() porque te borra adminPeriodId, loginOpen, etc.
}

/** ✅ Forgot password: backend devuelve { message, token } (para pruebas) */
export async function forgotPassword(email: string): Promise<{ message: string; token: string }> {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
}

/** ✅ Reset password */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, newPassword });
}
