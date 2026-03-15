import { useEffect, useState } from "react";
import { useOneSignal } from "@/hooks/useOneSignal";

export default function OneSignalInit() {
  const { user, profile } = useAuth();
  const { role, loading: roleLoading } = useAdmin();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for OneSignal to be available
    const initOneSignal = async () => {
      try {
        if (typeof window !== "undefined" && window.OneSignal) {
          console.log("[OneSignalInit] OneSignal already available");
          setInitialized(true);
          return;
        }

        // Wait for OneSignal to load from CDN
        const checkInterval = setInterval(() => {
          if (window.OneSignal) {
            console.log("[OneSignalInit] OneSignal loaded from CDN");
            clearInterval(checkInterval);
            setInitialized(true);
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.OneSignal) {
            console.error("[OneSignalInit] OneSignal failed to load within 10 seconds");
            setError("OneSignal SDK failed to load");
          }
        }, 10000);
      } catch (err) {
        console.error("[OneSignalInit] Error:", err);
        setError("Failed to initialize notifications");
      }
    };

    initOneSignal();
  }, []);

  // Log debug info
  useEffect(() => {
    console.log("[OneSignalInit] State:", {
      user: user?.id,
      profile: profile?.email,
      role,
      roleLoading,
      initialized,
      error,
      oneSignalExists: !!window.OneSignal,
      notificationsModule: window.OneSignal?.Notifications,
    });
  }, [user, profile, role, roleLoading, initialized, error]);

  // This component doesn't render anything visible
  return null;
}