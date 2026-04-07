import { useEffect, useRef } from "react";
import { requestUserPermission, setBackgroundMessageHandler } from "./firebase-messaging";
import { supabase } from "@/integrations/supabase/client";

export function useFCM() {
  const isLoaded = useRef(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) return;
    isLoaded.current = true;

    (async () => {
      const token = await requestUserPermission();
      if (token) {
        setToken(token);
        // Store token in Supabase
        const { data, error } = await supabase.from("user_push_tokens").upsert({
          user_id: supabase.auth.user()?.id,
          role: supabase.auth.user()?.userMetadata?.role,
          fcm_token: token,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        if (error) console.error("Failed to store FCM token:", error);
      }
    })();
  }, []);

  // Set up background message handler
  useEffect(() => {
    setBackgroundMessageHandler();
  }, []);

  return { token };
}