import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
    // Add service worker configuration
    serviceWorker: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      strategies: "generateSW",
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: null,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Add Firebase service worker to precache
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.gstatic\.com\/firebasejs\/.+\.js$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-scripts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: "BizMart Store",
        short_name: "BizMart",
        description: "Your Online School Store App",
        theme_color: "#e8612d",
        background_color: "#ffffff",
        display: "standalone",
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
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add build configuration for service worker
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('node_modules')) return 'vendor';
          return 'app';
        },
      },
    },
  },
}));