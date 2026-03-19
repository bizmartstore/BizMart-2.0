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
    if (window.OneSignal && window.OneSignal.initialized) {
      return resolve(window.OneSignal);
    }

    const timer = setTimeout(() => resolve(null), timeoutMs);

    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push((OS: any) => {
        clearTimeout(timer);
        resolve(OS);
      });
    } else {
      // If OneSignal is already on window but not initialized, wait for it
      const checkInterval = setInterval(() => {
        if (window.OneSignal && window.OneSignal.initialized) {
          clearInterval(checkInterval);
          clearTimeout(timer);
          resolve(window.OneSignal);
        }
      }, 100);
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
          await OneSignal.logout();
          console.log("[OneSignal] User logged out");
        } catch (e) {
          console.warn("[OneSignal] Logout failed:", e);
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
        // Modern SDK login
        await OneSignal.login(user.id);
        console.log(`[OneSignal] Logged in as: ${user.id}`);

        const isAdminRole = effectiveRole === "main_admin" || effectiveRole === "member_admin";

        // Set tags for targeting
        await OneSignal.User.addTags({
          user_id: user.id,
          email: profile.email || "",
          name: `${profile.first_name} ${profile.last_name}`,
          role: effectiveRole,
          admin: isAdminRole ? "true" : "false",
        });
        
        taggedRef.current = `${user.id}_${effectiveRole}`;
        console.log(`[OneSignal] User tagged as ${effectiveRole}`);
      } catch (e) {
        console.warn("[OneSignal] Tagging failed:", e);
      }
    };

    doTag();
    return () => { cancelled = true; };
  }, [user, profile, role, roleLoading]);
}

export async function promptForPush() {
  const OneSignal = (window as any).OneSignal;
  if (!OneSignal) {
    console.warn("[OneSignal] Cannot prompt: SDK not found on window.");
    return;
  }
  
  try {
    console.log("[OneSignal] Manually triggering slidedown prompt...");
    // Try slidedown first as it's less intrusive and works better on mobile
    await OneSignal.Slidedown.promptPush();
  } catch (e) {
    console.error("[OneSignal] Manual prompt failed:", e);
    // Fallback to native browser prompt
    try {
      await OneSignal.Notifications.requestPermission();
    } catch (err) {
      console.error("[OneSignal] Native fallback failed:", err);
    }
  }
}