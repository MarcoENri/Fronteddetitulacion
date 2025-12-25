import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://localhost:8081",
      "/admin": "http://localhost:8081",
      "/me": "http://localhost:8081",
    },
  },
});
