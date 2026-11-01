import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { VitePWA } from "vite-plugin-pwa";

const manifest = JSON.parse(readFileSync(new URL("./public/manifest.webmanifest", import.meta.url), "utf8"));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["icons/icon-48.png", "apple-touch-icon.png", "car-wash.jpg"],
      manifest,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,webp,woff2}"],
        globIgnores: ["**/Octocat.png"],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
