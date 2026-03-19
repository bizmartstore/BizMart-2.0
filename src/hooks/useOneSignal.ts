import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

export function useOneSignal() {
  const { user, profile } = useAuth();
  const { role, loading: roleLoading } = useAdmin();
  const syncRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !profile || roleLoading) return;

    const effectiveRole = role || "customer";
    const syncKey = `${user.id}_${effectiveRole}`;
    if (syncRef.current === syncKey) return;

    // Wait for OneSignal to be ready
    const waitForOneSignal = setInterval(() => {
      if (window.OneSignal && window.OneSignal.initialized) {
        clearInterval(waitForOneSignal);
        syncUserTags(effectiveRole);
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(waitForOneSignal);
    }, 5000);

    function syncUserTags(role: string) {
      const OneSignal = window.OneSignal;
      if (!OneSignal) return;

      const isAdmin = role === "main_admin" || role === "member_admin";
      
      OneSignal.User.addTags({
        user_id: user.id,
        role: role,
        admin: isAdmin ? "true" : "false",
        email: profile.email || "",
        grade_level: profile.grade_level || "",
        section: profile.section || "",
      }).then(() => {
        console.log(`[OneSignal] Tags synced for ${user.id} as ${role}`);
        syncRef.current = syncKey;
      }).catch((error: any) => {
        console.error("[OneSignal] Tag sync failed:", error);
      });
    }
  }, [user, profile, role, roleLoading]);
}

export async function getPushStatus() {
  const OneSignal = (window as any).OneSignal;
  if (!OneSignal) return { status: "SDK not loaded" };
  
  try {
    const permission = await OneSignal.Notifications.getPermission();
    const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
    const externalId = await OneSignal.User.externalId;
    
    return {
      permission,
      isOptedIn,
      externalId,
      isReady: permission === "granted" && isOptedIn && !!externalId
    };
  } catch (e) {
    return { status: "error", error: e.message };
  }
}