// Static SPA build config for GitHub Pages (no SSR / no Nitro / no server entry).
// The Lovable preview + hosted app keep using vite.config.ts (TanStack Start SSR).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

/** Parse a dotenv file without letting empty process env values shadow it. */
function readDotenv(file: string): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    for (const line of readFileSync(resolve(process.cwd(), file), "utf8").split("\n")) {
      const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
      if (!match) continue;
      out[match[1]] = (match[2] ?? "").trim().replace(/^["'](.*)["']$/, "$1");
    }
    return out;
  } catch {
    return {};
  }
}

const fileEnv = { ...readDotenv(".env"), ...readDotenv(".env.production") };

/**
 * CI sets `VITE_*` from repository variables. When a variable is not configured
 * GitHub injects an EMPTY string, which would otherwise override the committed
 * .env value and ship a build with no Supabase config (runtime crash).
 */
function envValue(key: string, fallback = ""): string {
  const fromProcess = process.env[key]?.trim();
  return fromProcess || fileEnv[key]?.trim() || fallback;
}

const SUPABASE_URL = envValue("VITE_SUPABASE_URL");
const SUPABASE_PUBLISHABLE_KEY = envValue("VITE_SUPABASE_PUBLISHABLE_KEY");

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Static build aborted: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set (env var or .env file).",
  );
}

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
  // Static hosting: everything runs in the browser. Inline the publishable
  // (non-secret) Supabase config so the SPA works without a server runtime.
  define: {
    "process.env": "{}",
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(envValue("VITE_SUPABASE_PROJECT_ID")),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(envValue("VITE_API_BASE_URL")),
  },
});
