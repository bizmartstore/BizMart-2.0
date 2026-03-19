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

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        // 1. Ensure user is logged in to OneSignal with their Supabase ID
        await OneSignal.login(user.id);
        
        // 2. Set tags for targeting (Admin vs Customer)
        const isAdminRole = effectiveRole === "main_admin" || effectiveRole === "member_admin";
        await OneSignal.User.addTags({
          user_id: user.id,
          role: effectiveRole,
          admin: isAdminRole ? "true" : "false",
          email: profile.email || "",
        });

        syncRef.current = syncKey;
        console.log(`[OneSignal] Synced: ${user.id} as ${effectiveRole}`);
      } catch (e) {
        console.error("[OneSignal] Sync Error:", e);
      }
    });
  }, [user, profile, role, roleLoading]);
}

export async function getPushStatus() {
  const OneSignal = (window as any).OneSignal;
  if (!OneSignal) return "SDK Not Loaded";
  
  const permission = OneSignal.Notifications.permission;
  const isOptedIn = await OneSignal.User.PushSubscription.optedIn;
  const externalId = await OneSignal.User.externalId;
  
  return {
    permission,
    isOptedIn,
    externalId,
    isReady: permission === "granted" && isOptedIn && !!externalId
  };
}