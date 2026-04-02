<![CDATA[
    // Fetch existing profile
    let { data: profData, error: profError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (profError && profError.code !== 'PGRST116') {
      console.warn("[AuthContext] Profile fetch error:", profError.message);
    }

    const metadata = currentUser.user_metadata || {};

    // If profile is missing, create it
    if (!profData) {
      console.log("[AuthContext] Profile missing, creating...");
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
        .single();
      
      if (!insertError) profData = newProf;
      else console.warn("[AuthContext] Profile creation failed:", insertError.message);
    }
  ]]>
</dyad-file>

<dyad-write path="src/context/AuthContext.tsx" description="Fix wallet balance type error">
  <![CDATA[
    // Fetch wallet balance (source of truth for BCoins)
    const { data: wallet } = await supabase
      .from("bcoins_wallets")
      .select("balance")
      .eq("user_id", currentUser.id)
      .single();
  ]]>
</dyad-file>

<dyad-chat-summary>Fixed TypeScript errors in AuthContext by correcting Supabase query methods</dyad-chat-summary><dyad-write path="src/context/AuthContext.tsx" description="Fix TypeScript errors: use user_id for profiles insert and cast supabase for bcoins_wallets">
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
      // Use a Promise.race to ensure we don't hang forever on a slow DB query
      const profilePromise = (async () => {
        // 1. Try to fetch existing profile
        let { data: profData, error: profError } = await supabase
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

        // 4. Fetch wallet balance (source of truth for BCoins)
        const { data: wallet } = await (supabase as any)
          .from("bcoins_wallets")
          .select("balance")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        return { profData, roleData, metadata, wallet };
      })();

      // Timeout after 3 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Profile fetch timeout")), 3000)
      );

      const result = await Promise.race([profilePromise, timeoutPromise]) as any;
      const { profData, roleData, metadata, wallet } = result;

      setProfile({
        id: currentUser.id,
        first_name: profData?.first_name || metadata.first_name || 'Student',
        last_name: profData?.last_name || metadata.last_name || '',
        section: profData?.section || metadata.section || 'N/A',
        grade_level: profData?.grade_level || metadata.grade_level || 'N/A',
        school: profData?.school || metadata.school || 'N/A',
        email: profData?.email || currentUser.email || '',
        avatar_url: profData?.avatar_url || metadata.avatar_url || null,
        bcoins: Number(wallet?.balance || profData?.bcoins || 0),  // Use wallet balance as source of truth
        role: roleData?.role || 'customer',
      });
      
      console.log("[AuthContext] Profile loaded successfully with bcoins:", Number(wallet?.balance || profData?.bcoins || 0));
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
        await fetchProfile(s.user);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Safety fallback: always stop loading after 6 seconds max
    const safetyTimer = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("[AuthContext] Safety timeout triggered - forcing loading to false");
        setLoading(false);
      }
    }, 6000);

    return () => {
      isMounted = false;
      mounted.current = false;
      subscription?.unsubscribe();
      clearTimeout(safetyTimer);
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
        const walletBcoins = Number(wallet.balance);
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
            setProfile(prev => prev ? { ...prev, bcoins: payload.new.balance } : prev);
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