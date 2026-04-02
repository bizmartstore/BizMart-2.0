"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

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
      // Try to fetch existing profile using id (not user_id)
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profError) {
        console.warn("[AuthContext] Profile fetch error:", profError.message);
      }

      const metadata = currentUser.user_metadata || {};

      // If profile is missing, create it
      if (!profData && !profError) {
        console.log("[AuthContext] Profile missing, creating...");
        const profileInsert = {
          id: currentUser.id,
          email: currentUser.email,
          first_name: metadata.first_name || '',
          last_name: metadata.last_name || '',
          school: metadata.school || '',
          section: metadata.section || '',
          grade_level: metadata.grade_level || '',
          bcoins: 0,
        };

        const { data: newProf, error: insertError } = await supabase
          .from("profiles")
          .insert([profileInsert]) // Use array syntax
          .select()
          .single();
        
        if (!insertError) {
          profData = newProf;
        } else {
          console.warn("[AuthContext] Profile creation failed:", insertError.message);
        }
      }

      // Fetch role if available
      let roleData: any = null;
      try {
        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle();
        roleData = role;
      } catch (e) {
        // Role table might not exist yet, that's okay
        console.log("[AuthContext] User roles table not available");
      }

      if (profData) {
        setProfile({
          ...profData,
          role: roleData?.role || 'customer',
        });
        console.log("[AuthContext] Profile loaded successfully");
      }
    } catch (err: any) {
      console.warn("[AuthContext] Profile fetch issue:", err.message);
      // Fallback to metadata if DB fails
      const metadata = currentUser.user_metadata || {};
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        first_name: metadata.first_name || 'Student',
        last_name: metadata.last_name || '',
        school: metadata.school || 'N/A',
        section: metadata.section || 'N/A',
        grade_level: metadata.grade_level || 'N/A',
        bcoins: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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