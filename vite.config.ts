import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://26.146.215.130:8081",
      "/admin": "http://26.146.215.130:8081",
      "/me": "http://26.146.215.130:8081",
    },
  },
});
