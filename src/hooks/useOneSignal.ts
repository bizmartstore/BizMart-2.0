import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

function getOneSignal(timeoutMs = 10000): Promise<any | null> {
  return new Promise((resolve) => {
    if (window.OneSignal && typeof window.OneSignal.login === "function") {
      return resolve(window.OneSignal);
    }

    const timer = setTimeout(() => resolve(null), timeoutMs);

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
            console.log("[OneSignal] logout success");
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
      if (!OneSignal || cancelled) return;

      try {
        // Ensure we are logged in with the Supabase UID
        if (typeof OneSignal.login === "function") {
          await OneSignal.login(user.id);
          console.log(`[OneSignal] login(${user.id}) success`);
        }

        if (OneSignal.User) {
          const isAdminRole = effectiveRole === "main_admin" || effectiveRole === "member_admin";

          // Set tags for targeting
          if (typeof OneSignal.User.addTags === "function") {
            await OneSignal.User.addTags({
              user_id: user.id,
              email: profile.email || "",
              name: `${profile.first_name} ${profile.last_name}`,
              role: effectiveRole,
              admin: isAdminRole ? "true" : "false",
            });
            taggedRef.current = `${user.id}_${effectiveRole}`;
            console.log(`[OneSignal] Tagged user as ${effectiveRole}`);
          }
        }

        // Auto-request for everyone if they haven't decided yet
        if (OneSignal.Notifications) {
          const perm = await OneSignal.Notifications.permission;
          if (perm === "default") {
            console.log("[OneSignal] Requesting permission...");
            await OneSignal.Notifications.requestPermission();
          }
        }
      } catch (e) {
        console.warn("[OneSignal] setup failed:", e);
      }
    };

    doTag();
    return () => { cancelled = true; };
  }, [user, profile, role, roleLoading]);
}

export async function promptForPush() {
  const OneSignal = await getOneSignal(5000);
  if (!OneSignal?.Notifications) return;
  try {
    await OneSignal.Notifications.requestPermission();
  } catch (_) {}
}