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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      // 1. Try to get data from the public.profiles table
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (profError) console.warn("[AuthContext] Profile fetch error:", profError);

      // 2. Get the user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      // 3. Get metadata from the Auth user object (this is where sign-up data lives)
      const metadata = currentUser.user_metadata || {};
      
      // 4. Merge data: Database takes priority, then Metadata, then empty string
      const finalProfile: Profile = {
        id: profData?.id || currentUser.id,
        user_id: currentUser.id,
        first_name: profData?.first_name || metadata.first_name || '',
        last_name: profData?.last_name || metadata.last_name || '',
        section: profData?.section || metadata.section || '',
        grade_level: profData?.grade_level || metadata.grade_level || '',
        school: profData?.school || metadata.school || '',
        email: profData?.email || currentUser.email || '',
        avatar_url: profData?.avatar_url || metadata.avatar_url || null,
        role: roleData?.role || 'customer',
      };

      console.log("[AuthContext] Profile loaded:", finalProfile);
      setProfile(finalProfile);
    } catch (err) {
      console.error("[AuthContext] Failed to fetch profile:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  useEffect(() => {
    const currentProjectUrl = import.meta.env.VITE_SUPABASE_URL;
    const lastProjectUrl = localStorage.getItem("last_supabase_url");

    if (lastProjectUrl && lastProjectUrl !== currentProjectUrl) {
      supabase.auth.signOut();
      localStorage.clear();
      localStorage.setItem("last_supabase_url", currentProjectUrl);
      window.location.reload();
      return;
    }

    localStorage.setItem("last_supabase_url", currentProjectUrl);

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchProfile(initialSession.user);
        }
      } catch (err) {
        console.error("[AuthContext] Initial session error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user);
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
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem("supabase.auth.token");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}