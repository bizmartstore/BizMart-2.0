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
      setProfile(data);
    } catch (err) {
      console.error("[AuthContext] Profile fetch error:", err);
      setProfile(null);
    }
  };

  // Fetch user role
  const fetchUserRole = async (userId: string) => {
    try {
      const { data } = await (supabase as any).rpc('get_user_role', { _user_id: userId });
      return data;
    } catch (err) {
      console.error("[AuthContext] Role fetch error:", err);
      return null;
    }
  };

  useEffect(() => {
    // Check if we need to clear session due to project change
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] Auth event: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile and role in parallel
          await Promise.all([
            fetchProfile(session.user.id),
            fetchUserRole(session.user.id).then(role => {
              // Attach role to user object for OneSignal
              if (session.user && role) {
                session.user.role = role;
              }
            })
          ]);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[AuthContext] Session error:", error);
        supabase.auth.signOut();
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchUserRole(session.user.id).then(role => {
            if (session.user && role) {
              session.user.role = role;
            }
          })
        ]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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