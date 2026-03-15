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
 * Wait for OneSignal SDK to be fully initialized.
 */
function getOneSignal(timeoutMs = 10000): Promise<any | null> {
  return new Promise((resolve) => {
    if (
      window.OneSignal &&
      typeof window.OneSignal.isInitialized === "function" &&
      window.OneSignal.isInitialized()
    ) {
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

/**
 * Hook that:
 *   • logs the user in to OneSignal (external_id = user.id)
 *   • tags the user with role & admin flag
 *   • waits for the FIRST user gesture (touch/click) before requesting
 *     the native browser permission prompt.
 *   • persists the permission result so we never ask again.
 */
export function useOneSignal() {
  const { user, profile } = useAuth();
  const { role, loading: roleLoading } = useAdmin();

  // Ref to remember whether we have already tagged the user in OneSignal
  const taggedRef = useRef<string | null>(null);
  // Ref to remember the last user id we saw (to detect logout)
  const prevUserRef = useRef<string | null>(null);
  // Ref to remember whether we have already shown the permission prompt
  const promptedRef = useRef<boolean>(false);

  // -----------------------------------------------------------------
  // 1️⃣  Logout handling – clear OneSignal state when the user signs out
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!user && prevUserRef.current) {
      // User just logged out → clear OneSignal bindings
      (async () => {
        const OneSignal = await getOneSignal(3000);
        if (!OneSignal) return;
        try {
          if (typeof OneSignal.logout === "function") {
            await OneSignal.logout();
            console.log("[OneSignal] logout success – device unlinked");
          }
        } catch (e) {
          console.warn("[OneSignal] logout failed:", e);
        }
      })();
      taggedRef.current = null;
      prevUserRef.current = null;
      promptedRef.current = false; // reset so a new login will prompt again
    } else if (user) {
      prevUserRef.current = user.id;
    }
  }, [user]);

  // -----------------------------------------------------------------
  // 2️⃣  Tag the user (login + tags) once the SDK is ready and we have
  //     a resolved role.
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!user || !profile || roleLoading) return;

    const effectiveRole = role || "customer";

    // Avoid re‑tagging if we already tagged this exact user+role
    if (taggedRef.current === `${user.id}_${effectiveRole}`) return;

    let cancelled = false;

    const doTag = async () => {
      const OneSignal = await getOneSignal();
      if (!OneSignal || cancelled) return;

      // ---- Login (external_id) -------------------------------------------------
      try {
        if (typeof OneSignal.login === "function") {
          await OneSignal.login(user.id);
          console.log(`[OneSignal] login(${user.id}) success`);
        }
      } catch (e) {
        console.warn("[OneSignal] login failed:", e);
      }

      // ---- Tagging -------------------------------------------------------------
      try {
        if (OneSignal.User) {
          const isAdminRole =
            effectiveRole === "main_admin" ||
            effectiveRole === "member_admin";

          // Remove any stale tags first
          if (typeof OneSignal.User.removeTags === "function") {
            await OneSignal.User.removeTags([
              "role",
              "user_id",
              "email",
              "name",
              "admin",
            ]);
          }
          // Set fresh tags
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
              `[OneSignal] Tagged user – role: ${effectiveRole}, admin: ${isAdminRole}`
            );
          }
        }
      } catch (e) {
        console.warn("[OneSignal] tagging failed:", e);
      }

      // ---- Permission request – we will do this on the first user gesture ----
      // (see the gesture listener added later)
    };

    doTag();

    return () => {
      cancelled = true;
    };
  }, [user, profile, role, roleLoading]);

  // -----------------------------------------------------------------
  // 3️⃣  Wait for the FIRST user gesture (touch/click) before requesting
  //     the native permission prompt.  This satisfies iOS’s requirement
  //     that the prompt be triggered by a user interaction.
  // -----------------------------------------------------------------
  useEffect(() => {
    // If we already know the permission result from a previous visit,
    // we don’t need to show the prompt again.
    const stored = localStorage.getItem("pushPermission");
    if (stored) {
      // Permission already known – nothing else to do.
      return;
    }

    // If the user has already been prompted in this session, skip.
    if (promptedRef.current) return;

    const handleGesture = async () => {
      // Prevent multiple calls if the user taps repeatedly
      if (promptedRef.current) return;
      promptedRef.current = true;

      const OneSignal = await getOneSignal();
      if (!OneSignal?.Notifications) {
        console.warn("[OneSignal] Notifications API not ready");
        return;
      }

      try {
        const permission = await OneSignal.Notifications.requestPermission();
        // Store the result so we never ask again on future loads
        localStorage.setItem("pushPermission", permission as string);
        console.log(
          `[OneSignal] Permission result: ${permission} (stored in localStorage)`
        );
      } catch (err: any) {
        console.error("[OneSignal] requestPermission failed:", err);
      }
    };

    // Use passive listeners for better performance; they work on touch &
    // click.
    const options: AddEventListenerOptions = { passive: true };
    document.addEventListener("touchstart", handleGesture, options);
    document.addEventListener("click", handleGesture, options);

    // Cleanup
    return () => {
      document.removeEventListener("touchstart", handleGesture, options);
      document.removeEventListener("click", handleGesture, options);
    };
  }, []); // run once on mount

  // -----------------------------------------------------------------
  // 4️⃣  Helper for manual prompting (kept for compatibility)
  // -----------------------------------------------------------------
  const promptForPush = useCallback(async () => {
    const OneSignal = await getOneSignal(5000);
    if (!OneSignal?.Notifications) return;
    try {
      const permission = await OneSignal.Notifications.requestPermission();
      localStorage.setItem("pushPermission", permission as string);
    } catch (_) {}
  }, []);

  // We don’t need to return anything from the hook – all side‑effects
  // happen inside the useEffect blocks above.
  return { promptForPush };
}