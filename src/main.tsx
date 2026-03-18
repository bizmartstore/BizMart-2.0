import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register OneSignal service worker for push notifications
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/OneSignalSDKWorker.js")
    .then((registration) => {
      console.log("[Service Worker] Registered successfully:", registration);
    })
    .catch((error) => {
      console.error("[Service Worker] Registration failed:", error);
    });
}

createRoot(document.getElementById("root")!).render(<App />);