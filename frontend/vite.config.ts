import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Prefetch lucide so barrel imports don't stall first paint (bundle-barrel-imports)
  optimizeDeps: {
    include: ["lucide-react", "react-router-dom"],
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
