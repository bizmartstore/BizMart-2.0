import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { getFCMToken } from "@/firebase";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  school: string | null;
  grade_level: string | null;
  section: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  // New fields
  role: string;
  fcm_token: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAuthReady: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Token storage
  const [fcmToken, setFCMToken] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Request permission and get token
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await getFCMToken();
          setFCMToken(token);
          // Store token in user profile
          if (user) {
            await supabase.from("user_push_tokens").upsert({
              user_id: user.id,
              fcm_token: token,
              role: profile?.role || "customer",
              updated_at: new Date().toISOString(),
            });
          }
        }
        // Load profile
        if (user) {
          const { data: prof, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!error && prof) {
            setProfile({ ...prof, role: prof.role || "customer" });
          }
        }
      } catch (err) {
        console.warn("FCM token request failed:", err);
      } finally {
        setLoading(false);
        setIsAuthReady(true);
      }
    };

    init();

    const channel = supabase.channel("fcm-token")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_push_tokens" }, () => {
        // Refresh token on any change
        init();
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loading]);

  useEffect(() => {
    const cleanup = () => {
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
      setIsAuthReady(false);
      setFCMToken(null);
    };
    return cleanup;
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
    setIsAuthReady(false);
    setFCMToken(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  // Helper to load profile with role and token
  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    if (!error && data) {
      setProfile({ ...data, role: data.role || "customer" });
    }
  }, []);

  // Expose methods
  const value = {
    user,
    session,
    profile,
    loading,
    isAuthReady,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}