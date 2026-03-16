import { useEffect, useRef, useCallback } from "react";
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
  const initAttemptedRef = useRef(false);

  // Clean up old user tags when logging out
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
      initAttemptedRef.current = false;
    } else if (user) {
      prevUserRef.current = user.id;
    }
  }, [user]);

  const initOneSignal = useCallback(async () => {
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const OneSignal = await getOneSignal(5000);
    if (!OneSignal) {
      console.warn("[OneSignal] SDK not loaded");
      return;
    }

    try {
      // Wait for service worker to be ready
      if (navigator.serviceWorker) {
        await navigator.serviceWorker.ready;
        console.log("[OneSignal] Service Worker ready");
      }

      // Set up notification permission handler
      if (OneSignal.Notifications) {
        OneSignal.Notifications.addEventListener('click', (event: any) => {
          console.log('[OneSignal] Notification clicked:', event);
        });

        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
          console.log('[OneSignal] Foreground notification:', event);
        });
      }

      console.log("[OneSignal] Initialized successfully");
    } catch (e) {
      console.warn("[OneSignal] Init error:", e);
      initAttemptedRef.current = false; // Allow retry
    }
  }, []);

  // Handle user role tagging
  useEffect(() => {
    if (!user || !profile || roleLoading) return;

    const effectiveRole = role || "customer";
    if (taggedRef.current === `${user.id}_${effectiveRole}`) return;

    let cancelled = false;

    const tagUser = async () => {
      const OneSignal = await getOneSignal(3000);
      if (!OneSignal || cancelled) return;

      try {
        // Ensure we're logged in with the user's Supabase UID
        if (typeof OneSignal.login === "function") {
          await OneSignal.login(user.id);
          console.log(`[OneSignal] login(${user.id}) success`);
        }

        if (OneSignal.User && typeof OneSignal.User.addTags === "function") {
          const isAdminRole = effectiveRole === "main_admin" || effectiveRole === "member_admin";
          
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

        // Request permission if not decided
        if (OneSignal.Notifications) {
          const permission = await OneSignal.Notifications.permission;
          if (permission === "default") {
            console.log("[OneSignal] Requesting permission...");
            await OneSignal.Notifications.requestPermission();
          }
        }
      } catch (e) {
        console.warn("[OneSignal] Tagging failed:", e);
      }
    };

    tagUser();
    return () => { cancelled = true; };
  }, [user, profile, role, roleLoading]);

  return {
    initOneSignal,
    isInitialized: !!taggedRef.current,
  };
}

export async function promptForPush() {
  const OneSignal = await getOneSignal(5000);
  if (!OneSignal?.Notifications) return;
  try {
    await OneSignal.Notifications.requestPermission();
  } catch (_) {}
}