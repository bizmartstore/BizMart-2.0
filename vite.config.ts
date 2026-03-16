import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // Automatically update the PWA without user prompt
      includeAssets: ["favicon.ico", "placeholder.svg"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        // Removed importScripts here to avoid conflict with OneSignal worker
        // OneSignal runs in its own SW: OneSignalSDKWorker.js / OneSignalSDKUpdaterWorker.js
        globIgnores: ["**/OneSignalSDK*"], // Don't precache OneSignal worker files
      },
      manifest: {
        name: "BizMart - Campus Store",
        short_name: "BizMart",
        description: "Your one-stop mobile school store for students",
        theme_color: "#e8612d",
        background_color: "#faf6f3",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));