import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import fs from "fs";
export default defineConfig(() => ({
  // VITE_BASE_PATH lets us deploy under a subfolder (e.g. GitHub Pages
  // /BizMart-2.0/) without changing anything for a root custom domain later.
  base: process.env.VITE_BASE_PATH || "/",
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    // GitHub Pages only serves 404.html for unknown paths, so mirror
    // index.html as 404.html to keep client-side routing working.
    {
      name: "spa-404-fallback",
      closeBundle() {
        fs.copyFileSync(
          path.resolve(__dirname, "dist/index.html"),
          path.resolve(__dirname, "dist/404.html")
        );
      },
    },
    VitePWA({
      registerType: "prompt", // Changed from autoUpdate to prevent restart loops
      injectRegister: "auto",
      strategies: "generateSW",
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: null,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "BizMart Store",
        short_name: "BizMart",
        description: "Your Online School Store App",
        theme_color: "#e8612d",
        background_color: "#ffffff",
        display: "standalone",
        // Relative to the manifest location, so it works both under a
        // GitHub Pages subfolder and at a custom domain root.
        start_url: ".",
        scope: ".",
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