"use client";

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
      // 1. Try to fetch existing profile
      let { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      const metadata = currentUser.user_metadata || {};

      // 2. If profile is missing, create it immediately
      if (!profData && !profError) {
        const { data: newProf, error: insertError } = await supabase
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
        
        if (!insertError) profData = newProf;
      }

      // 3. Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      // 4. Set state
      setProfile({
        id: currentUser.id,
        first_name: profData?.first_name || metadata.first_name || 'Student',
        last_name: profData?.last_name || metadata.last_name || '',
        section: profData?.section || metadata.section || 'N/A',
        grade_level: profData?.grade_level || metadata.grade_level || 'N/A',
        school: profData?.school || metadata.school || 'N/A',
        email: profData?.email || currentUser.email || '',
        avatar_url: profData?.avatar_url || metadata.avatar_url || null,
        bcoins: Number(profData?.bcoins || 0),
        role: roleData?.role || 'customer',
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
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        setUser(s?.user ?? null);
        
        if (s?.user) {
          // Use a timeout to prevent hanging forever on profile fetch
          await Promise.race([
            fetchProfile(s.user),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
          ]).catch(err => console.warn("[AuthContext] Profile fetch issue:", err));
        }
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
      } finally {
        // Always resolve loading
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfile(s.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}