import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { vitePwa } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    vitePwa({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "BizMart Campus Store",
        short_name: "BizMart",
        description: "Your one-stop mobile school store for students",
        theme_color: "#e8612d",
        background_color: "#e8612d",
        display: "standalone",
        scope: "/",
        start_url: ".",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 5000000
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
        navigateFallback: "index.html",
        navigateFallbackAllowlist: [/^\/$/],
        type: "module"
      }
    })
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));