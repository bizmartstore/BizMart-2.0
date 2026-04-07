import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useAuth } from "@/context/AuthContext";

export default function PWARegister() {
  const { updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Check for updates every hour
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    // Optional: Check for updates immediately on load
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  return null;
}