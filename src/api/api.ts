import axios from "axios";

export const api = axios.create({
  baseURL: "http://26.146.215.130:8081",
});

api.interceptors.request.use(
  (config) => {
    // Leemos de localStorage para persistencia entre pestañas
    const token = localStorage.getItem("token"); 
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    // Si el token es inválido o expiró
    if (status === 401 || status === 403) {
      localStorage.clear(); 
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);