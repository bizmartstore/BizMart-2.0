import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  section: string;
  grade_level: string;
  school: string;
  email: string;
  avatar_url: string | null;
  bcoins: number;
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
      // Use 'as any' to bypass table name type strictness if types are out of sync
      const { data: profData } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      const metadata = currentUser.user_metadata || {};
      let finalProf = profData;

      if (!profData) {
        const { data: newProf } = await (supabase as any)
          .from("profiles")
          .insert({
            id: currentUser.id,
            email: currentUser.email,
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            school: metadata.school || '',
            section: metadata.section || '',
            grade_level: metadata.grade_level || '',
            bcoins: 0
          })
          .select()
          .single();
        finalProf = newProf;
      }

      const { data: roleData } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      // Ensure all fields have guaranteed string/number fallbacks to satisfy the Profile interface
      setProfile({
        id: currentUser.id,
        first_name: String(finalProf?.first_name || metadata.first_name || 'Student'),
        last_name: String(finalProf?.last_name || metadata.last_name || ''),
        section: String(finalProf?.section || metadata.section || 'N/A'),
        grade_level: String(finalProf?.grade_level || metadata.grade_level || 'N/A'),
        school: String(finalProf?.school || metadata.school || 'N/A'),
        email: String(finalProf?.email || currentUser.email || ''),
        avatar_url: finalProf?.avatar_url || metadata.avatar_url || null,
        bcoins: Number(finalProf?.bcoins || 0),
        role: String(roleData?.role || 'customer'),
      });
    } catch (err) {
      console.error("[AuthContext] Unexpected error:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await fetchProfile(s.user);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await fetchProfile(s.user);
      else setProfile(null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within CartProvider");
  return context;
}