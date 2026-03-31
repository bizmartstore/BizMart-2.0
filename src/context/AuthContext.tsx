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

  // Load persisted session on mount
  useEffect(() => {
    const persisted = localStorage.getItem("supabase.auth.token");
    if (persisted) {
      // Restore session from localStorage
      const { access_token, refresh_token, expires_at } = JSON.parse(persisted);
      const token = btoa(access_token + ":" + refresh_token);
      supabase.auth.setSession(access_token, refresh_token, expires_at);
    }
  }, []);

  useEffect(() => {
    const { data: { session } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setSession(session);
          setUser(session.user);
          // Persist token to localStorage
          localStorage.setItem("supabase.auth.token", JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          }));
        } else {
          localStorage.removeItem("supabase.auth.token");
        }
        // Load profile
        if (session?.user) {
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (!error && profileData) {
            setProfile(profileData);
          } else {
            // Default profile if none exists
            setProfile({
              id: "",
              user_id: session.user.id,
              first_name: "",
              last_name: "",
              section: "",
              grade_level: "",
              school: "",
              email: session.user.email,
              avatar_url: null,
              role: "customer",
            });
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      supabase.auth.onAuthStateChange(_event => {});
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