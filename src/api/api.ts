import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8081",
});

// ✅ siempre adjunta el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ si el backend responde 401/403, cerrar sesión automático
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);
