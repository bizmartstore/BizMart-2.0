import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

/**
 * Wait for OneSignal SDK to be fully initialized and have Notifications available.
 */
function getOneSignal(timeoutMs = 20000): Promise<any | null> {
  return new Promise((resolve) => {
    const start = Date.now();
    
    const check = () => {
      // OneSignal may be present but Notifications not ready yet
      if (window.OneSignal && 
          typeof window.OneSignal.Notifications !== "undefined" &&
          typeof window.OneSignal.Notifications.requestPermission === "function" &&
          typeof window.OneSignal.Notifications.permission === "function") {
        console.log("[OneSignal] SDK fully ready with Notifications");
        resolve(window.OneSignal);
        return;
      }
      
      if (Date.now() - start > timeoutMs) {
        console.warn("[OneSignal] Initialization timeout after", timeoutMs, "ms");
        console.warn("[OneSignal] Current state:", {
          exists: !!window.OneSignal,
          notifications: window.OneSignal?.Notifications,
          requestPermission: window.OneSignal?.Notifications?.requestPermission,
          permission: window.OneSignal?.Notifications?.permission,
        });
        resolve(null);
        return;
      }
      
      setTimeout(check, 200);
    };
    
    check();
  });
}

export function useOneSignal() {
  const { user, profile } = useAuth();
  const { role, loading: roleLoading } = useAdmin();
  const taggedRef = useRef<string | null>(null);
  const prevUserRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Logout from OneSignal when user signs out
  useEffect(() => {
    if (!user && prevUserRef.current) {
      // User just logged out — clear OneSignal state
      (async () => {
        const OneSignal = await getOneSignal(3000);
        if (!OneSignal) return;
        try {
          if (typeof OneSignal.logout === "function") {
            await OneSignal.logout();
            console.log("[OneSignal] logout success — device unlinked");
          }
        } catch (e) {
          console.warn("[OneSignal] logout failed:", e);
        }
      })();
      taggedRef.current = null;
      prevUserRef.current = null;
      initializedRef.current = false;
    } else if (user) {
      prevUserRef.current = user.id;
    }
  }, [user]);

  // Tag user when logged in and role is resolved
  useEffect(() => {
    if (!user || !profile || roleLoading) return;

    const effectiveRole = role || "customer";

    // Don't re-tag if already tagged with same user+role
    if (taggedRef.current === `${user.id}_${effectiveRole}` && initializedRef.current) {
      console.log("[OneSignal] Already tagged with same user/role, skipping");
      return;
    }

    let cancelled = false;

    const doTag = async () => {
      const OneSignal = await getOneSignal();
      if (!OneSignal || cancelled) {
        console.warn("[OneSignal] Not available or cancelled");
        return;
      }

      console.log("[OneSignal] Initializing for user:", user.id, "role:", effectiveRole);

      // Step 1: Login with external user ID — re-links device to this user
      try {
        if (typeof OneSignal.login === "function") {
          await OneSignal.login(user.id);
          console.log(`[OneSignal] login(${user.id}) success`);
        }
      } catch (e) {
        console.warn("[OneSignal] login failed:", e);
      }

      // Step 2: Remove old tags then set new ones (prevents stale role tags)
      try {
        if (OneSignal.User) {
          const isAdminRole = effectiveRole === "main_admin" || effectiveRole === "member_admin";

          // Remove potentially stale tags first
          if (typeof OneSignal.User.removeTags === "function") {
            await OneSignal.User.removeTags(["role", "user_id", "email", "name", "admin"]);
            console.log("[OneSignal] Removed old tags");
          }
          // Set fresh tags — include admin=true for easy targeting
          if (typeof OneSignal.User.addTags === "function") {
            await OneSignal.User.addTags({
              user_id: user.id,
              email: profile.email || "",
              name: `${profile.first_name} ${profile.last_name}`,
              role: effectiveRole,
              admin: isAdminRole ? "true" : "false",
            });
            taggedRef.current = `${user.id}_${effectiveRole}`;
            initializedRef.current = true;
            console.log(`[OneSignal] Tagged user — role: ${effectiveRole}, admin: ${isAdminRole}`);
          }
        }
      } catch (e) {
        console.warn("[OneSignal] tagging failed:", e);
      }

      // Step 3: Check subscription status and auto-request permission for admins
      try {
        if (OneSignal.Notifications) {
          // permission is a string: "default" | "granted" | "denied"
          const perm = await OneSignal.Notifications.permission;
          const isPushSupported = OneSignal.Notifications.isPushSupported?.() ?? true;

          // Check if device is actually subscribed (opted-in)
          const optedIn = OneSignal.User?.PushSubscription?.optedIn ?? false;
          const subscriptionId = OneSignal.User?.PushSubscription?.id ?? null;
          console.log(
            `[OneSignal] Permission: "${perm}" | Push supported: ${isPushSupported} | OptedIn: ${optedIn} | SubscriptionId: ${subscriptionId}`
          );

          // If permission is default (user hasn't decided) and push is supported, request permission for admins
          if (perm === "default" && isPushSupported) {
            if (effectiveRole === "main_admin" || effectiveRole === "member_admin") {
              console.log("[OneSignal] Admin detected — requesting push permission...");
              try {
                await OneSignal.Notifications.requestPermission();
                // Re-check after request
                const newPerm = await OneSignal.Notifications.permission;
                const newOptedIn = OneSignal.User?.PushSubscription?.optedIn ?? false;
                console.log(`[OneSignal] After request — Permission: "${newPerm}" | OptedIn: ${newOptedIn}`);
              } catch (permError) {
                console.error("[OneSignal] requestPermission error:", permError);
              }
            }
          } else if (perm === "granted" && !optedIn) {
            console.warn("[OneSignal] Permission granted but device NOT opted-in — push may not work!");
          } else if (perm === "granted" && optedIn) {
            console.log("[OneSignal] Device is fully subscribed and ready to receive push.");
          } else if (perm === "denied") {
            console.log("[OneSignal] Permission denied by user — cannot request again without user action");
          }
        }
      } catch (e) {
        console.warn("[OneSignal] permission check failed:", e);
      }
    };

    doTag();

    return () => { cancelled = true; };
  }, [user, profile, role, roleLoading]);
}

export async function promptForPush() {
  console.log("[OneSignal] promptForPush called");
  const OneSignal = await getOneSignal(10000);
  if (!OneSignal) {
    console.warn("[OneSignal] OneSignal not initialized or timed out");
    alert("Push notification service is not ready. Please try again in a few seconds.");
    return;
  }
  
  if (!OneSignal.Notifications) {
    console.warn("[OneSignal] Notifications module not available");
    alert("Push notifications are not available on this device.");
    return;
  }
  
  try {
    const permission = await OneSignal.Notifications.permission;
    console.log("[OneSignal] Current permission state:", permission);
    
    if (permission === "granted") {
      console.log("[OneSignal] Permission already granted");
      alert("Notifications are already enabled!");
      return;
    }
    
    if (permission === "denied") {
      console.log("[OneSignal] Permission denied — cannot request again");
      alert("Notifications are blocked. Please enable them in your browser settings.");
      return;
    }
    
    console.log("[OneSignal] Requesting permission...");
    await OneSignal.Notifications.requestPermission();
    
    // Check result
    const newPermission = await OneSignal.Notifications.permission;
    console.log("[OneSignal] Permission after request:", newPermission);
    
    if (newPermission === "granted") {
      console.log("[OneSignal] Permission granted successfully!");
      alert("Notifications enabled! You'll now receive updates.");
    } else {
      console.log("[OneSignal] Permission not granted");
      alert("Please allow notifications in the prompt that appears.");
    }
  } catch (err) {
    console.error("[OneSignal] Error during promptForPush:", err);
    alert("Failed to request notification permission. Please check your browser settings.");
  }
}