import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}

/** Wait for OneSignal SDK to be fully initialized with Notifications. */
function getOneSignal(timeoutMs = 10000): Promise<any | null> {
  return new Promise((resolve) => {
    const checkReady = () => {
      if (
        window.OneSignal &&
        typeof window.OneSignal.Notifications?.requestPermission === "function"
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
    checkReady(); // check immediately
  });
}

/** Request push notification permission from the user */
export async function promptForPush() {
  const OneSignal = await getOneSignal(5000);
  if (!OneSignal?.Notifications) {
    throw new Error("OneSignal Notifications not available");
  }
  try {
    const permission = OneSignal.Notifications.permission;
    if (permission === "granted") {
      return;
    }
    // Request permission with a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("requestPermission timeout")), 10000)
    );
    const newPermission = await Promise.race([
      OneSignal.Notifications.requestPermission(),
      timeoutPromise,
    ]);
    if (newPermission === "granted") {
      console.log("[OneSignal] Push permission granted");
    } else {
      console.log("[OneSignal] Push permission denied:", newPermission);
    }
  } catch (error) {
    console.error("[OneSignal] Error requesting permission:", error);
    throw error;
  }
}

export function useOneSignal() {
  const { user, profile } = useAuth();
  const { role, loading: roleLoading } = useAdmin();
  const taggedRef = useRef<string | null>(null);
  const prevUserRef = useRef<string | null>(null);

  // Initialize OneSignal on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // If OneSignal is already initialized, skip
    if (window.OneSignal?.isInitialized) {
      return;
    }

    // Ensure OneSignal array exists
    window.OneSignal = window.OneSignal || [];

    // Push init if not already pushed
    if (!window.OneSignal._initPushed) {
      window.OneSignal._initPushed = true;
      window.OneSignal.push(function () {
        const appId =
          import.meta.env.VITE_ONESIGNAL_APP_ID ||
          "56883e62-5aae-4486-b9c3-84e5e1db41c9";
        window.OneSignal.init({
          appId: appId,
          // Optional: set up notification click handler
          // notifyButton: { autoRegister: true },
          // ... other options
        });
      });
    }
  }, []);

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
    } else if (user) {
      prevUserRef.current = user.id;
    }
  }, [user]);

  // Tag user when logged in and role is resolved
  useEffect(() => {
    if (!user || !profile || roleLoading) return;

    const effectiveRole = role || "customer";

    // Don't re-tag if already tagged with same user+role
    if (taggedRef.current === `${user.id}_${effectiveRole}`) return;

    let cancelled = false;

    const doTag = async () => {
      const OneSignal = await getOneSignal();
      if (!OneSignal || cancelled) return;

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
          const isAdminRole =
            effectiveRole === "main_admin" || effectiveRole === "member_admin";

          // Remove potentially stale tags first
          if (typeof OneSignal.User.removeTags === "function") {
            await OneSignal.User.removeTags([
              "role",
              "user_id",
              "email",
              "name",
              "admin",
            ]);
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
            console.log(
              `[OneSignal] Tagged user — role: ${effectiveRole}, admin: ${isAdminRole}`
            );
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
          const isPushSupported =
            OneSignal.Notifications.isPushSupported?.() ?? true;

          // Check if device is actually subscribed (opted-in)
          const optedIn = OneSignal.User?.PushSubscription?.optedIn ?? false;
          const subscriptionId = OneSignal.User?.PushSubscription?.id ?? null;
          console.log(
            `[OneSignal] Permission: "${perm}" | Push supported: ${isPushSupported} | OptedIn: ${optedIn} | SubscriptionId: ${subscriptionId}`
          );

          // If not granted and push supported, request permission for admins
          if (perm !== "granted" && isPushSupported) {
            if (effectiveRole === "main_admin" || effectiveRole === "member_admin") {
              console.log(
                "[OneSignal] Admin detected — requesting push permission..."
              );
              await OneSignal.Notifications.requestPermission();
              // Re-check after request
              const newPerm = await OneSignal.Notifications.permission;
              const newOptedIn =
                OneSignal.User?.PushSubscription?.optedIn ?? false;
              console.log(
                `[OneSignal] After request — Permission: "${newPerm}" | OptedIn: ${newOptedIn}`
              );
            }
          } else if (perm === "granted" && !optedIn) {
            console.warn(
              "[OneSignal] Permission granted but device NOT opted-in — push may not work!"
            );
          } else if (perm === "granted" && optedIn) {
            console.log(
              "[OneSignal] Device is fully subscribed and ready to receive push."
            );
          }
        }
      } catch (e) {
        console.warn("[OneSignal] permission check failed:", e);
      }
    };

    doTag();

    return () => {
      cancelled = true;
    };
  }, [user, profile, role, roleLoading]);
}