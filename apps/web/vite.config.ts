import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Load .env from monorepo root
  envDir: "../../",
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/")
          ) {
            return "react-vendor";
          }
          if (id.includes("node_modules/firebase")) {
            return "firebase-vendor";
          }
          if (id.includes("node_modules/@line/liff")) {
            return "line-vendor";
          }
        },
      },
    },
  },
});
