import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // --------------------------------------------------------------
  // 1️⃣  Subscribe to the user’s FCM token (stored in `fcm_tokens`)
  // --------------------------------------------------------------
  useEffect(() => {
    if (!user) return;

    // 1️⃣  Get (or create) the token
    async function getToken() {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      // Try to fetch an existing token
      const { data: tokenData, error: tokenError } = await supabase        .from("fcm_tokens")
        .select("token")
        .eq("user_id", user.id)
        .single();

      if (tokenError && tokenError.code !== "PGRST_ERR_NO_ROWS") throw tokenError;

      if (tokenData) return tokenData.token;

      // If we have no token yet, request one from the browser
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // @ts-ignore – `getToken` is part of the Web Push API
      const token = await (await import("firebase/messaging")).getMessaging()
        .getToken({ vapidKey: "YOUR_VAPID_KEY_HERE" }); // <-- replace with your VAPID key

      // Store it in the DB      if (token) {
        await supabase.from("fcm_tokens").upsert({
          user_id: user.id,
          token,
          device_type: "web",
        });
      }
      return token;
    }

    // Run once on mount
    getToken().catch(console.error);
  }, [user]);

  // … existing return { user, session, profile, loading, isAuthReady, signOut, refreshProfile } …