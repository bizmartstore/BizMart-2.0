import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

/**
 * Wait for OneSignal SDK to be fully initialized.
 */
function getOneSignal(timeoutMs = 10000): Promise<any | null> {
  return new Promise((resolve) => {
    if (window.OneSignal && typeof window.OneSignal.login === "function") {
      return resolve(window.OneSignal);
    }

    const timer = setTimeout(() => {
      console.warn("[OneSignal] getOneSignal timeout after", timeoutMs, "ms");
      resolve(null);
    }, timeoutMs);

    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push((OS: any) => {
        clearTimeout(timer);
        resolve(OS);
      });
    } else {
      clearTimeout(timer);
      resolve(null);
    }
  });
}

export function useOneSignal() {
  const { user, profile } = useAuth();
  const { role, loading: roleLoading } = useAdmin();
  const taggedRef = useRef<string | null>(null);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user && prevUserRef.current) {
      (async () => {
        const OneSignal = await getOneSignal(3000);
        if (!OneSignal) return;
        try {
          if (typeof OneSignal.logout === "function") {
            await OneSignal.logout();
          }
        } catch (e) {
          console.warn("[OneSignal] logout failed:", e);
        }
      })();
      taggedRef.current = null;
      prevUserRef.current = null;
    } else if (user) {
      prevUserRef.current = user.id;
    }
  }, [user]);

  useEffect(() => {
    if (!user || !profile || roleLoading) return;

    const effectiveRole = role || "customer";
    if (taggedRef.current === `${user.id}_${effectiveRole}`) return;

    let cancelled = false;

    const doTag = async () => {
      const OneSignal = await getOneSignal();
      // Check if OneSignal is actually initialized to avoid "Ye" error
      if (!OneSignal || cancelled || !OneSignal.Notifications) {
        console.warn("[OneSignal] SDK not fully initialized or domain mismatch error occurred.");
        return;
      }

      try {
        if (typeof OneSignal.login === "function") {
          await OneSignal.login(user.id);
          console.log(`[OneSignal] login(${user.id}) success`);
        }
      } catch (e) {
        console.warn("[OneSignal] login failed:", e);
      }

      try {
        if (OneSignal.User) {
          const isAdminRole = effectiveRole === "main_admin" || effectiveRole === "member_admin";
          if (typeof OneSignal.User.removeTags === "function") {
            await OneSignal.User.removeTags(["role", "user_id", "email", "name", "admin"]);
          }
          if (typeof OneSignal.User.addTags === "function") {
            await OneSignal.User.addTags({
              user_id: user.id,
              email: profile.email || "",
              name: `${profile.first_name} ${profile.last_name}`,
              role: effectiveRole,
              admin: isAdminRole ? "true" : "false",
            });
            taggedRef.current = `${user.id}_${effectiveRole}`;
          }
        }
      } catch (e) {
        console.warn("[OneSignal] tagging failed:", e);
      }
    };

    doTag();
    return () => { cancelled = true; };
  }, [user, profile, role, roleLoading]);
}

export async function promptForPush() {
  console.log("[NotificationPromptBanner] Allow button clicked, requesting push permission...");
  const OneSignal = await getOneSignal(10000);
  if (!OneSignal?.Notifications) {
    console.warn("[NotificationPromptBanner] OneSignal Notifications not available. Check domain settings in OneSignal dashboard.");
    return;
  }
  try {
    const permission = await OneSignal.Notifications.permission;
    const permissionString = typeof permission === 'boolean' ? (permission ? 'granted' : 'denied') : permission;
    
    if (permissionString === "default") {
      await OneSignal.Notifications.requestPermission();
    }
  } catch (error) {
    console.error("[NotificationPromptBanner] Error requesting permission:", error);
  }
}