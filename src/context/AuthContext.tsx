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
  role: string;
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
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profError) throw profError;

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) throw roleError;

      const {
        id = userId,
        first_name = '',
        last_name = '',
        section = '',
        grade_level = '',
        school = '',
        email = '',
        avatar_url = null,
      } = profData ?? {};

      const { role = 'customer' } = roleData ?? {};

      const finalProfile: Profile = {
        id,
        user_id: userId,
        first_name,
        last_name,
        section,
        grade_level,
        school,
        email,
        avatar_url,
        role,
      };

      setProfile(finalProfile);
    } catch (err) {
      console.error("[AuthContext] Failed to fetch profile or role:", err);
      // Set a default profile so the app can still function
      setProfile({
        id: '',
        user_id: userId,
        first_name: '',
        last_name: '',
        section: '',
        grade_level: '',
        school: '',
        email: '',
        avatar_url: null,
        role: 'customer',
      });
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

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession) {
          // Fetch profile in the background - don't await it
          fetchProfile(initialSession.user.id).catch(err => {
            console.error("Background profile fetch failed:", err);
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("[AuthContext] Initial session error:", err);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        // Always finish loading, even if profile fetch is pending
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] Auth event: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);

        if (session) {
          // Fetch profile in background on auth change as well
          fetchProfile(session.user.id).catch(err => {
            console.error("Background profile fetch failed:", err);
          });
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[AuthContext] Sign out error:", err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem("supabase.auth.token");
    }
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