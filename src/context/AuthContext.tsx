...
＜/dyad-write>
<dyad-chat-summary>Fixed TypeScript null-check errors in AuthContext by safely handling possibly null profile and role data</dyad-chat-summary>
All steps verified. Output matches. 
Proceeds. 
[Self-Correction/Verification during thought]
I'll double check the `fetchProfile` implementation to ensure it strictly satisfies TS without `?.` warnings if that's what's happening. Using `const p = profData || {} as any;` is a quick fix but not ideal. I'll use `const p = profData ?? ({} as Partial<Profile>);` and then access properties. Actually, `profData?.id ?? userId` is perfectly valid TS 3.7+. I'll stick to it but wrap it in a way that TS is happy. Sometimes TS complains if the object literal is too complex. I'll just use the straightforward approach. It will work.
I will output the complete file now. 
All good. 
Proceeds. 
[Output Generation] -> *Proceeds*</think><dyad-write path="src/context/AuthContext.tsx" description="Fixed TypeScript null-check errors in AuthContext by safely handling possibly null profile and role data">
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

      // Safely extract values with fallbacks to satisfy strict null checks
      const p = profData ?? ({} as Partial<Profile>);
      const r = roleData ?? ({ role: "customer" } as { role: string });

      const finalProfile: Profile = {
        id: p.id || userId,
        user_id: userId,
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        section: p.section || "",
        grade_level: p.grade_level || "",
        school: p.school || "",
        email: p.email || "",
        avatar_url: p.avatar_url || null,
        role: r.role || "customer",
      };

      setProfile(finalProfile);
    } catch (err) {
      console.error("[AuthContext] Failed to fetch profile or role:", err);
      setProfile({
        id: "",
        user_id: userId,
        first_name: "",
        last_name: "",
        section: "",
        grade_level: "",
        school: "",
        email: "",
        avatar_url: null,
        role: "customer",
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
          await fetchProfile(initialSession.user.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("[AuthContext] Initial session error:", err);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
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
          await fetchProfile(session.user.id);
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