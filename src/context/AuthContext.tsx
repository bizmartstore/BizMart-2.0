import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
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
  user: UserProfile | null;
  loading: boolean;
  profile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async (userId: string, email: string, metadata: any) => {
    try {
      let { data: profData } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

      if (!profData) {
        const { data: newProf } = await supabase.from("profiles").insert({
          id: userId, email, first_name: metadata.first_name || '', last_name: metadata.last_name || '',
          school: metadata.school || '', section: metadata.section || '', grade_level: metadata.grade_level || '', bcoins: 0
        }).select().single();
        if (newProf) profData = newProf;
      }

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();

      const newProfile: UserProfile = {
        id: userId,
        first_name: profData?.first_name || metadata.first_name || 'Student',
        last_name: profData?.last_name || metadata.last_name || '',
        section: profData?.section || metadata.section || 'N/A',
        grade_level: profData?.grade_level || metadata.grade_level || 'N/A',
        school: profData?.school || metadata.school || 'N/A',
        email: profData?.email || email || '',
        avatar_url: profData?.avatar_url || metadata.avatar_url || null,
        bcoins: Number(profData?.bcoins || 0),
        role: roleData?.role || 'customer',
      };
      setProfile(newProfile);
      setUser(newProfile);
    } catch (err: any) {
      console.warn("[AuthContext] Profile fetch issue:", err.message);
      const fallback: UserProfile = {
        id: userId, first_name: metadata.first_name || 'Student', last_name: metadata.last_name || '',
        section: metadata.section || 'N/A', grade_level: metadata.grade_level || 'N/A',
        school: metadata.school || 'N/A', email: email || '', avatar_url: metadata.avatar_url || null,
        bcoins: 0, role: 'customer',
      };
      setProfile(fallback);
      setUser(fallback);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata || {});
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id, session.user.email || '', session.user.user_metadata || {});
      else { setUser(null); setProfile(null); }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return <AuthContext.Provider value={{ user, loading, profile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}