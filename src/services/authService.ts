import { api } from "../api/api";

export type LoginResponse = { token: string; username: string };

export async function login(username: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", { username, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}
