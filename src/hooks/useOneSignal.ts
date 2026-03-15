import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

const ALLOWED_DOMAIN = "bizmart.vercel.app";

/** Check if we are on the correct domain for OneSignal */
function isCorrectDomain() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === ALLOWED_DOMAIN || hostname === "localhost" || hostname === "127.0.0.1";
}

/** Wait for OneSignal SDK to be fully initialized with Notifications. */
function getOneSignal(timeoutMs = 10000): Promise<any | null> {
  return new Promise((resolve) => {
    if (!isCorrectDomain()) {
      console.warn("[OneSignal] Skipping initialization: Domain mismatch.");
      resolve(null);
      return;
    }

    const checkReady = () => {
      if (
        window.OneSignal &&
        window.OneSignal.isInitialized?.() &&
        window.OneSignal.Notifications
      ) {
        clearTimeout(timer);
        clearInterval(interval);
        resolve(window.OneSignal);
      }
    };

    const timer = setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, timeoutMs);

    const interval = setInterval(checkReady, 100);
    checkReady();
  });
}

/** Request push notification permission from the user */
export async function promptForPush() {
  const OneSignal = await getOneSignal(5000);
  if (!OneSignal?.Notifications) {
    console.warn("[OneSignal] Notifications API not available (likely domain mismatch or blocked)");
    return;
  }
  
  try {
    const permission = await OneSignal.Notifications.permission;
    if (permission === "granted") return;

    await OneSignal.Notifications.requestPermission();
  } catch (error) {
    console.error("[OneSignal] Error requesting permission:", error);
  }
}

export function useOneSignal() {
  const { user, profile } = useAuth();
  const { role, loading: roleLoading } = useAdmin();
  const taggedRef = useRef<string | null>(null);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !isCorrectDomain()) return;

    window.OneSignal = window.OneSignal || [];
    if (!window.OneSignal._initPushed) {
      window.OneSignal._initPushed = true;
      window.OneSignal.push(() => {
        window.OneSignal.init({
          appId: "56883e62-5aae-4486-b9c3-84e5e1db41c9",
          allowLocalhostAsSecureOrigin: true,
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!user && prevUserRef.current) {
      (async () => {
        const OneSignal = await getOneSignal(3000);
        if (OneSignal?.logout) {
          try { await OneSignal.logout(); } catch (e) { console.warn(e); }
        }
      })();
      taggedRef.current = null;
      prevUserRef.current = null;
    } else if (user) {
      prevUserRef.current = user.id;
    }
  }, [user]);

  useEffect(() => {
    if (!user || !profile || roleLoading || !isCorrectDomain()) return;

    const effectiveRole = role || "customer";
    if (taggedRef.current === `${user.id}_${effectiveRole}`) return;

    const doTag = async () => {
      const OneSignal = await getOneSignal();
      if (!OneSignal) return;

      try {
        // Ensure we are initialized before login
        if (typeof OneSignal.login === "function") {
          await OneSignal.login(user.id);
        }

        if (OneSignal.User?.addTags) {
          const isAdminRole = effectiveRole === "main_admin" || effectiveRole === "member_admin";
          await OneSignal.User.addTags({
            user_id: user.id,
            email: profile.email || "",
            name: `${profile.first_name} ${profile.last_name}`,
            role: effectiveRole,
            admin: isAdminRole ? "true" : "false",
          });
          taggedRef.current = `${user.id}_${effectiveRole}`;
        }
      } catch (e) {
        console.warn("[OneSignal] Setup failed:", e);
      }
    };

    doTag();
  }, [user, profile, role, roleLoading]);
}