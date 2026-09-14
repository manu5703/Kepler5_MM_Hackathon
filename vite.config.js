import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend talks to the Express shim over /api — never to Anthropic
// directly. This keeps the API key server-side even in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
