"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
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
  const mounted = useRef(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    console.log(`[AuthContext] Fetching profile for: ${currentUser.email}`);
    
    try {
      // 1. Try to fetch existing profile
      let { data: profData, error: profError } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profError) {
        console.warn("[AuthContext] Profile fetch error:", profError.message);
      }

      const metadata = currentUser.user_metadata || {};

      // 2. If profile is missing, create it
      if (!profData && !profError) {
        console.log("[AuthContext] Profile missing, creating...");
        const { data: newProf, error: insertError } = await (supabase as any)
          .from("profiles")
          .insert({
            user_id: currentUser.id,
            email: currentUser.email,
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || '',
            school: metadata.school || null,
            section: metadata.section || null,
            grade_level: metadata.grade_level || null,
            avatar_url: metadata.avatar_url || null,
          })
          .select()
          .single();
        
        if (!insertError) profData = newProf;
        else console.warn("[AuthContext] Profile creation failed:", insertError.message);
      }

      // 3. Fetch role
      const { data: roleData } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      // 4. Fetch wallet balance (source of truth for BCoins)
      const { data: wallet } = await (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      const { profData: finalProf, roleData: finalRole, wallet: finalWallet } = { profData, roleData, wallet };

      // Determine role: use roleData if available, else 'customer'
      const role = finalRole?.role || 'customer';
      
      // Save role to localStorage for this user (for fallback on future failures)
      if (finalRole?.role) {
        localStorage.setItem(`user_role_${currentUser.id}`, finalRole.role);
      }

      setProfile({
        id: currentUser.id,
        first_name: finalProf?.first_name || metadata.first_name || 'Student',
        last_name: finalProf?.last_name || metadata.last_name || '',
        section: finalProf?.section || metadata.section || 'N/A',
        grade_level: finalProf?.grade_level || metadata.grade_level || 'N/A',
        school: finalProf?.school || metadata.school || 'N/A',
        email: finalProf?.email || currentUser.email || '',
        avatar_url: finalProf?.avatar_url || metadata.avatar_url || null,
        bcoins: Number(finalWallet?.balance || finalProf?.bcoins || 0),
        role,
      });
      
      console.log("[AuthContext] Profile loaded successfully with role:", role, "bcoins:", Number(finalWallet?.balance || finalProf?.bcoins || 0));
    } catch (err: any) {
      console.warn("[AuthContext] Profile fetch issue:", err.message);
      // Fallback: use metadata and stored role from localStorage
      const metadata = currentUser.user_metadata || {};
      
      // Try to get role from localStorage for this user (persisted from previous successful login)
      const storedRole = localStorage.getItem(`user_role_${currentUser.id}`);
      const role = storedRole || 'customer'; // Only fallback to 'customer' if no stored role exists
      
      console.log("[AuthContext] Using stored role from localStorage:", role);
      
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
        role,
      });
    }
  }, []);

  const refreshProfile = async () => {
    if (user && mounted.current) await fetchProfile(user);
  };

  useEffect(() => {
    let isMounted = true;
    mounted.current = isMounted;

    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        setSession(s);
        setUser(s?.user ?? null);
        
        if (s?.user) {
          // Check localStorage first for immediate role assignment
          const storedRole = localStorage.getItem(`user_role_${s.user.id}`);
          if (storedRole) {
            console.log("[AuthContext] Using stored role from localStorage during init:", storedRole);
            // Set a temporary profile with stored role while we fetch full profile
            const metadata = s.user.user_metadata || {};
            setProfile({
              id: s.user.id,
              first_name: metadata.first_name || 'Student',
              last_name: metadata.last_name || '',
              section: metadata.section || 'N/A',
              grade_level: metadata.grade_level || 'N/A',
              school: metadata.school || 'N/A',
              email: s.user.email || '',
              avatar_url: metadata.avatar_url || null,
              bcoins: 0,
              role: storedRole,
            });
          }
          await fetchProfile(s.user);
        }
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log("[AuthContext] Initialization complete");
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log(`[AuthContext] Auth state changed: ${event}`);
      if (!isMounted) return;

      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user) {
        // Check localStorage first for immediate role assignment
        const storedRole = localStorage.getItem(`user_role_${s.user.id}`);
        if (storedRole) {
          console.log("[AuthContext] Using stored role from localStorage during auth change:", storedRole);
          const metadata = s.user.user_metadata || {};
          setProfile({
            id: s.user.id,
            first_name: metadata.first_name || 'Student',
            last_name: metadata.last_name || '',
            section: metadata.section || 'N/A',
            grade_level: metadata.grade_level || 'N/A',
            school: metadata.school || 'N/A',
            email: s.user.email || '',
            avatar_url: metadata.avatar_url || null,
            bcoins: 0,
            role: storedRole,
          });
        }
        await fetchProfile(s.user);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      isMounted = false;
      mounted.current = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Subscribe to wallet changes to update bcoins in real-time
  useEffect(() => {
    if (!user) return;

    // First, sync current wallet balance to profile (handles out-of-sync scenarios)
    const syncWallet = async () => {
      const { data: wallet } = await (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (wallet && profile) {
        const walletBcoins = Number((wallet as any).balance);
        if (profile.bcoins !== walletBcoins) {
          setProfile(prev => prev ? { ...prev, bcoins: walletBcoins } : prev);
        }
      }
    };

    syncWallet();

    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bcoins_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (!mounted.current) return;
          if (payload.event === 'DELETE') {
            setProfile(prev => prev ? { ...prev, bcoins: 0 } : prev);
          } else if (payload.new) {
            setProfile(prev => prev ? { ...prev, bcoins: Number((payload.new as any).balance) } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    // Clear stored role for this user (optional, but keeps localStorage clean)
    if (user) {
      localStorage.removeItem(`user_role_${user.id}`);
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