import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  section: string;
  grade_level: string;
  school: string;
  email: string;
  avatar_url: string | null;
  role: string; // ✅ role field (default "customer")
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      // ✅ Ensure role defaults to "customer" and handle null data
      const profileWithRole = {
        ...(data ?? {}),
        role: data?.role || "customer",
      };

      setProfile(profileWithRole);
    } catch (err) {
      console.error("[AuthContext] Profile fetch error:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    const currentProjectUrl = import.meta.env.VITE_SUPABASE_URL;
    const lastProjectUrl = localStorage.getItem("last_supabase_url");

    if (lastProjectUrl && lastProjectUrl !== currentProjectUrl) {
      console.warn("[AuthContext] Supabase project changed! Clearing old session...");
      supabase.auth.signOut();
      localStorage.clear();
      localStorage.setItem("last_supabase_url", currentProjectUrl);
      window.location.reload();
      return;
    }

    localStorage.setItem("last_supabase_url", currentProjectUrl);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] Auth event: ${event}`);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Initial session    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error("[AuthContext] Session error:", error);
        await supabase.auth.signOut();
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    });

    return () => {
      // cleanup subscription
      // (supabase auth subscriber is cleaned up automatically by Supabase)
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem("supabase.auth.token");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}