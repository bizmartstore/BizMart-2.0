"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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

  const fetchProfile = useCallback(async (currentUser: User) => {
    console.log(`[AuthContext] Fetching profile for: ${currentUser.email}`);
    
    try {
      // Use a Promise.race to ensure we don't hang forever on a slow DB query
      const profilePromise = (async () => {
        // 1. Try to fetch existing profile
        let { data: profData, error: profError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (profError) {
          console.warn("[AuthContext] Profile fetch error:", profError.message);
        }

        const metadata = currentUser.user_metadata || {};

        // 2. If profile is missing, create it with user_id as FK
        if (!profData && !profError) {
          console.log("[AuthContext] Profile missing, creating...");
          const { data: newProf, error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: currentUser.id,
              email: currentUser.email,
              first_name: metadata.first_name || '',
              last_name: metadata.last_name || '',
              school: metadata.school || '',
              section: metadata.section || '',
              grade_level: metadata.grade_level || '',
              bcoins: 0,
            })
            .select()
            .single();
          
          if (!insertError) profData = newProf;
          else console.warn("[AuthContext] Profile creation failed:", insertError.message);
        }

        // 3. Fetch role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        return { profData, roleData, metadata };
      })();

      // Timeout after 3 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Profile fetch timeout")), 3000)
      );

      const result = await Promise.race([profilePromise, timeoutPromise]) as any;
      const { profData, roleData, metadata } = result;

      setProfile({
        id: profData?.id || currentUser.id,
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
      
      console.log("[AuthContext] Profile loaded successfully");
    } catch (err: any) {
      console.warn("[AuthContext] Profile fetch issue:", err.message);
      // Fallback to metadata if DB fails or times out
      const metadata = currentUser.user_metadata || {};
      setProfile({
        id: currentUser.id,
        first_name: metadata.first_name || 'Student',
        last_name: metadata.last_name || '',
        section: metadata.section || 'N/A',
        grade_level: metadata.grade_level || 'N/A',
        school: metadata.school || 'N/A',
        email: currentUser.email || '',
        avatar_url: metadata.avatar_url || null,
        bcoins: 0,
        role: 'customer',
      });
    }
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(s);
        setUser(s?.user ?? null);
        
        if (s?.user) {
          await fetchProfile(s.user);
        }
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log("[AuthContext] Initialization complete");
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log(`[AuthContext] Auth state changed: ${event}`);
      if (!mounted) return;

      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user) {
        await fetchProfile(s.user);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Safety fallback: always stop loading after 6 seconds max
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[AuthContext] Safety timeout triggered - forcing loading to false");
        setLoading(false);
      }
    }, 6000);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [fetchProfile]);

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