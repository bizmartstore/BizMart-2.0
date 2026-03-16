import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clean up old service workers BEFORE anything else
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      // Unregister Vite PWA's sw.js but keep OneSignal's workers
      if (registration.scriptURL.includes('/sw.js') || registration.scriptURL.includes('vite')) {
        console.log('[Main] Unregistering old SW:', registration.scriptURL);
        registration.unregister();
      }
    }
  }).catch(err => {
    console.warn('[Main] SW cleanup error:', err);
  });
}

createRoot(document.getElementById("root")!).render(<App />);