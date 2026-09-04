// Static SPA build config for GitHub Pages (no SSR / no Nitro / no server entry).
// The Lovable preview + hosted app keep using vite.config.ts (TanStack Start SSR).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), tsConfigPaths({ projects: ["./tsconfig.json"] })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 8080,
    host: true,
  },
  // Static hosting: everything runs in the browser.
  define: {
    "process.env": "{}",
  },
});
