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

  const fetchProfile = useCallback(async (currentUser: User) => {
    // Deduplicate: if a fetch is already in progress for this user, return the existing promise
    if (fetchProfileRef.current) {
      return fetchProfileRef.current;
    }

    const currentRequestId = ++requestIdRef.current;
    
    const fetchPromise = (async () => {
      console.log(`[AuthContext] Fetching profile for: ${currentUser.email} (Request #${currentRequestId})`);
      
      try {
        // 1. Fetch existing profile
        let { data: profData, error: profError } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profError) {
          console.warn("[AuthContext] Profile fetch error:", profError.message);
        }

        const metadata = currentUser.user_metadata || {};

        // 2. Create profile if missing
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

        // Check if this request is still the latest
        if (currentRequestId !== requestIdRef.current) {
          console.log(`[AuthContext] Stale response ignored (Request #${currentRequestId})`);
          return;
        }

        // 3. Fetch role
        const { data: roleData } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        // 4. Fetch wallet balance
        const { data: wallet } = await (supabase as any)
          .from("bcoins_wallets")
          .select("balance")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        // Check again before mutating state
        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        const role = roleData?.role || 'customer';
        
        // Persist role for fallback
        if (roleData?.role) {
          localStorage.setItem(`user_role_${currentUser.id}`, roleData.role);
        }

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
        
        // Check if still valid before applying fallback
        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        // Preserve last known valid state or apply localStorage fallback
        const metadata = currentUser.user_metadata || {};
        const storedRole = localStorage.getItem(`user_role_${currentUser.id}`);
        const role = storedRole || 'customer';
        
        // Only update if we don't already have a valid profile
        setProfile(prev => prev || {
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
        
        console.log("[AuthContext] Applied fallback profile. Role:", role);
      } finally {
        // Clear the ref so future fetches can proceed
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
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        
        setSession(s);
        setUser(s?.user ?? null);
        
        if (s?.user) {
          // Apply stored role immediately for fast initial render
          const storedRole = localStorage.getItem(`user_role_${s.user.id}`);
          if (storedRole) {
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
        if (mountedRef.current) {
          setLoading(false);
          setIsAuthReady(true);
          console.log("[AuthContext] Initialization complete");
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
        // Only fetch on explicit sign-in to prevent duplicate calls
        const storedRole = localStorage.getItem(`user_role_${s.user.id}`);
        if (storedRole) {
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
        setIsAuthReady(true);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsAuthReady(true);
        requestIdRef.current++; // Invalidate any pending requests
        fetchProfileRef.current = null;
      } else if (event === 'TOKEN_REFRESHED' && s?.user) {
        // Token refresh doesn't need profile refetch, just update session
        setSession(s);
      } else {
        // For other events (INITIAL_SESSION, etc.), mark ready if not already
        setIsAuthReady(prev => prev || true);
      }
      
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      requestIdRef.current++; // Invalidate pending requests on unmount
      fetchProfileRef.current = null;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Subscribe to wallet changes
  useEffect(() => {
    if (!user) return;

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