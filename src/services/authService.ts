import { api } from "../api/api";

type LoginResponse = { token: string };

export async function login(username: string, password: string) {
  const res = await api.post<LoginResponse>("/auth/login", { username, password });

  // Cambiado a localStorage para que la sesión sobreviva al cerrar el navegador
  localStorage.setItem("token", res.data.token); 

  return res.data;
}

export function logout() {
  // Ahora sí borra el token correcto que usamos en toda la app
  localStorage.removeItem("token");
  localStorage.clear(); 
}