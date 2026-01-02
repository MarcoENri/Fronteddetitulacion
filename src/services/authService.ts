import { api } from "../api/api";

type LoginResponse = { token: string };

export async function login(username: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/login", { username, password });

  // ✅ guardar con la MISMA key que usa el interceptor
  localStorage.setItem("token", res.data.token);

  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
}
