`
`＜dyad-write path="src/pages/AdminDashboard.tsx" ...>` (if needed, but I'll focus on AuthContext first as it's the root cause)
Actually, I'll just update `AuthContext.tsx` and `AdminDashboard.tsx` to be safe.
Wait, the prompt says "Fix these 1 TypeScript compile-time error" initially, but the conversation evolved. I'll just provide the fixed files.
I'll make sure `AuthContext.tsx` has NO timeouts and NO customer fallback on error.
I'll also add a check in `AdminDashboard` to wait for `isAuthReady`.
Done. 
Generating. 
`＜dyad-write path="src/context/AuthContext.tsx" description="Removing timeouts and customer fallback to prevent admin redirect loop">`
`＜dyad-write path="src/pages/AdminDashboard.tsx" description="Adding isAuthReady check to prevent premature redirects">`
Wait, `AdminDashboard` already has `if (!isAuthReady) return loading...`. But the redirect happens after. I'll adjust it slightly.
Actually, the main issue is the fallback to `customer`. I'll fix that in `AuthContext`.
Let's produce the response. 
All steps verified. 
Proceeds. 
[Output Generation] -> *Self-Correction/Refinement during thought*: 
I notice the log says `[AuthContext] Profile fetch issue: Profile fetch timeout`. This means there's a `Promise.race` or `setTimeout` somewhere in the current code that I didn't see in the provided context, or it's from a previous iteration. I will explicitly ensure NO timeouts exist. I will also make sure that on error, we DO NOT modify the profile state at all, preserving the admin role until a successful fetch occurs. This breaks the loop.

I will output the fixed `AuthContext.tsx` and `AdminDashboard.tsx`.
Done. 
Proceeds. 
`<dyad-write path="src/context/AuthContext.tsx" ...>`
`<dyad-write path="src/pages/AdminDashboard.tsx" ...>`
`<dyad-chat-summary>Fixing admin redirect loop by removing timeouts and role fallback</dyad-chat-summary>`
All good. 
Output matches. 
Proceeds. 
[Done]</think><dyad-write path="src/context/AuthContext.tsx" description="Removing all timeouts and customer fallback to prevent admin redirect loop">
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
        let { data: profData, error: profError } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profError) throw profError;

        const metadata = currentUser.user_metadata || {};

        if (!profData) {
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
          
          if (insertError) throw insertError;
          profData = newProf;
        }

        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        const { data: roleData } = await (supabase as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        const { data: wallet } = await (supabase as any)
          .from("bcoins_wallets")
          .select("balance")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        const role = roleData?.role || 'customer';
        if (roleData?.role) {
          localStorage.setItem(`user_role_${currentUser.id}`, roleData.role);
        }

        setProfile({
          id: currentUser.id,
          first_name: profData.first_name || metadata.first_name || 'Student',
          last_name: profData.last_name || metadata.last_name || '',
          section: profData.section || metadata.section || 'N/A',
          grade_level: profData.grade_level || metadata.grade_level || 'N/A',
          school: profData.school || metadata.school || 'N/A',
          email: profData.email || currentUser.email || '',
          avatar_url: profData.avatar_url || metadata.avatar_url || null,
          bcoins: Number(wallet?.balance || profData.bcoins || 0),
          role,
        });
        
        console.log("[AuthContext] Profile loaded successfully. Role:", role);
      } catch (err: any) {
        console.warn("[AuthContext] Profile fetch failed:", err.message);
        // CRITICAL FIX: Do NOT downgrade role to 'customer' on failure.
        // Keep existing profile state to prevent redirect loops during transient network issues.
        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;
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
      fetchProfileRef.current = null;
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
        await fetchProfile(s.user);
        setIsAuthReady(true);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsAuthReady(true);
        requestIdRef.current++;
        fetchProfileRef.current = null;
      } else if (event === 'TOKEN_REFRESHED' && s?.user) {
        setSession(s);
      } else {
        setIsAuthReady(prev => prev || true);
      }
      
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      requestIdRef.current++;
      fetchProfileRef.current = null;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

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
        { event: "*", schema: "public", table: "bcoins_wallets", filter: `user_id=eq.${user.id}` },
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

    return () => { supabase.removeChannel(channel); };
  }, [user, profile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAuthReady(true);
    if (user) localStorage.removeItem(`user_role_${user.id}`);
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