import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// Relative base for builds so the bundle works at a domain root (Vercel/Netlify)
// or a subpath (GitHub Pages project site). Dev stays at "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  plugins: [react()],
}));
