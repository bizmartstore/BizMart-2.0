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
  isAuthReady: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // Concurrency guards
  const fetchProfileRef = useRef<Promise<void> | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (currentUser: User): Promise<void> => {
    if (fetchProfileRef.current) {
      return fetchProfileRef.current;
    }

    const currentRequestId = ++requestIdRef.current;
    
    const fetchPromise = (async () => {
      console.log(`[AuthContext] Fetching profile for: ${currentUser.email} (Request #${currentRequestId})`);
      
      try {
        // 1. Fetch existing profile with aggressive timeout
        let profData: any = null;
        
        const profilePromise = (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Profile fetch timed out")), 3000)
        );
        
        try {
          const result = await Promise.race([profilePromise, timeoutPromise]) as any;
          profData = result.data;
        } catch (err: any) {
          console.warn("[AuthContext] Profile fetch timeout or error:", err.message);
        }

        const metadata = currentUser.user_metadata || {};

        // 2. Create profile if missing (with timeout)
        if (!profData) {
          console.log("[AuthContext] Profile missing, creating...");
          try {
            const createPromise = (supabase as any)
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
              
            const createTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Profile creation timed out")), 3000)
            );
            
            const createResult = await Promise.race([createPromise, createTimeout]) as any;
            if (createResult.data) profData = createResult.data;
          } catch (err: any) {
            console.warn("[AuthContext] Profile creation failed:", err.message);
          }
        }

        // Check if this request is still the latest
        if (currentRequestId !== requestIdRef.current) {
          console.log(`[AuthContext] Stale response ignored (Request #${currentRequestId})`);
          return;
        }

        // 3. Fetch role with timeout
        let roleData: any = null;
        try {
          const rolePromise = (supabase as any)
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id)
            .maybeSingle();
            
          const roleTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Role fetch timed out")), 2000)
          );
          
          const roleResult = await Promise.race([rolePromise, roleTimeout]) as any;
          roleData = roleResult.data;
        } catch (err: any) {
          console.warn("[AuthContext] Role fetch error:", err.message);
        }

        // 4. Fetch wallet balance with timeout
        let wallet: any = null;
        try {
          const walletPromise = (supabase as any)
            .from("bcoins_wallets")
            .select("balance")
            .eq("user_id", currentUser.id)
            .maybeSingle();
            
          const walletTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Wallet fetch timed out")), 2000)
          );
          
          const walletResult = await Promise.race([walletPromise, walletTimeout]) as any;
          wallet = walletResult.data;
        } catch (err: any) {
          console.warn("[AuthContext] Wallet fetch error:", err.message);
        }

        // Final check before state update
        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        const role = roleData?.role || 'customer';
        
        // Persist role for future fallback
        if (roleData?.role) {
          localStorage.setItem(`user_role_${currentUser.id}`, roleData.role);
        }

        // Update profile with fresh DB data or fallback
        setProfile({
          id: currentUser.id,
          first_name: profData?.first_name || metadata.first_name || 'Student',
          last_name: profData?.last_name || metadata.last_name || '',
          section: profData?.section || metadata.section || 'N/A',
          grade_level: profData?.grade_level || metadata.grade_level || 'N/A',
          school: profData?.school || metadata.school || 'N/A',
          email: profData?.email || currentUser.email || '',
          avatar_url: profData?.avatar_url || metadata.avatar_url || null,
          bcoins: Number(wallet?.balance || profData?.bcoins || 0),
          role,
        });
        
        console.log("[AuthContext] Profile loaded successfully. Role:", role);
      } catch (err: any) {
        console.warn("[AuthContext] Profile fetch issue:", err.message);
        
        // Check if still valid
        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        // ON ERROR: Use localStorage fallback to preserve admin role
        const storedRole = localStorage.getItem(`user_role_${currentUser.id}`) || 'customer';
        const metadata = currentUser.user_metadata || {};
        
        console.warn("[AuthContext] Using localStorage fallback. Role:", storedRole);
        
        setProfile({
          id: currentUser.id,
          first_name: metadata.first_name || 'User',
          last_name: metadata.last_name || '',
          section: metadata.section || 'N/A',
          grade_level: metadata.grade_level || 'N/A',
          school: metadata.school || 'N/A',
          email: currentUser.email || '',
          avatar_url: metadata.avatar_url || null,
          bcoins: 0,
          role: storedRole,
        });
      } finally {
        if (fetchProfileRef.current === fetchPromise) {
          fetchProfileRef.current = null;
        }
      }
    })();

    fetchProfileRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  const refreshProfile = async () => {
    if (user && mountedRef.current) {
      fetchProfileRef.current = null; // Force new fetch
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        console.log("[AuthContext] Starting initialization...");
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        
        setSession(s);
        setUser(s?.user ?? null);
        
        // Mark auth as ready immediately after getting session
        // Don't wait for profile fetch to complete
        setLoading(false);
        setIsAuthReady(true);
        console.log("[AuthContext] Auth ready. Session:", !!s);
        
        if (s?.user) {
          // Fetch profile in background (won't block UI)
          fetchProfile(s.user);
        }
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
        // Ensure we don't get stuck on error
        if (mountedRef.current) {
          setLoading(false);
          setIsAuthReady(true);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log(`[AuthContext] Auth state changed: ${event}`);
      if (!mountedRef.current) return;

      setSession(s);
      setUser(s?.user ?? null);
      
      if (event === 'SIGNED_IN' && s?.user) {
        // Mark ready immediately
        setLoading(false);
        setIsAuthReady(true);
        // Fetch profile in background
        fetchProfile(s.user);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        setIsAuthReady(true);
        requestIdRef.current++;
        fetchProfileRef.current = null;
      } else if (event === 'TOKEN_REFRESHED' && s?.user) {
        setSession(s);
      } else if (event === 'INITIAL_SESSION') {
        // Already handled in init(), but ensure ready state
        setLoading(false);
        setIsAuthReady(true);
      } else {
        // For any other event, ensure we're marked as ready
        setLoading(false);
        setIsAuthReady(prev => prev || true);
      }
    });

    return () => {
      mountedRef.current = false;
      requestIdRef.current++;
      fetchProfileRef.current = null;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Subscribe to wallet changes
  useEffect(() => {
    if (!user) return;

    const syncWallet = async () => {
      try {
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
      } catch (err) {
        console.warn("[AuthContext] Wallet sync error:", err);
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
          if (!mountedRef.current) return;
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
    setIsAuthReady(true);
    if (user) {
      localStorage.removeItem(`user_role_${user.id}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isAuthReady, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}