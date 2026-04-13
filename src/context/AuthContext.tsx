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
  membership: any | null;
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
  const [membership, setMembership] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const fetchProfileRef = useRef<Promise<void> | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProfile = useCallback(async (currentUser: User): Promise<void> => {
    if (fetchProfileRef.current) return fetchProfileRef.current;
    const currentRequestId = ++requestIdRef.current;
    
    const fetchPromise = (async () => {
      try {
        // 1. Fetch Profile
        const { data: profData } = await (supabase as any).from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
        
        // 2. Fetch Role
        const { data: roleData } = await (supabase as any).from("user_roles").select("role").eq("user_id", currentUser.id).maybeSingle();
        
        // 3. Fetch Wallet
        const { data: wallet } = await (supabase as any).from("bcoins_wallets").select("balance").eq("user_id", currentUser.id).maybeSingle();

        // 4. Fetch Membership - get all memberships and find active ones
        let activeMembership = null;
        try {
          const { data: allMemberships, error: membershipError } = await (supabase as any)
            .from("club_memberships")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("expiry_date", { ascending: false });
          
          if (membershipError) {
            console.warn("[AuthContext] Membership query error:", membershipError.message);
          } else if (allMemberships && allMemberships.length > 0) {
            // Find active membership (status = 'active' OR expiry_date in future)
            activeMembership = allMemberships.find((m: any) =>
              m.status === 'active' || (m.expiry_date && new Date(m.expiry_date) > new Date())
            ) || null;
          }
        } catch (membershipErr) {
          console.warn("[AuthContext] Membership fetch error:", membershipErr);
        }

        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        const role = roleData?.role || (activeMembership ? 'customer' : 'customer');
        if (roleData?.role) localStorage.setItem(`user_role_${currentUser.id}`, roleData.role);

        setMembership(activeMembership);
        setProfile({
          id: currentUser.id,
          first_name: profData?.first_name || currentUser.user_metadata?.first_name || 'Student',
          last_name: profData?.last_name || currentUser.user_metadata?.last_name || '',
          section: profData?.section || currentUser.user_metadata?.section || 'N/A',
          grade_level: profData?.grade_level || currentUser.user_metadata?.grade_level || 'N/A',
          school: profData?.school || currentUser.user_metadata?.school || 'N/A',
          email: profData?.email || currentUser.email || '',
          avatar_url: profData?.avatar_url || currentUser.user_metadata?.avatar_url || null,
          bcoins: Number(wallet?.balance || profData?.bcoins || 0),
          role,
        });
      } catch (err) {
        console.warn("[AuthContext] Fetch issue:", err);
      } finally {
        if (fetchProfileRef.current === fetchPromise) fetchProfileRef.current = null;
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
        initTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) { setLoading(false); setIsAuthReady(true); }
        }, 5000);
        if (s?.user) fetchProfile(s.user);
        else { setLoading(false); setIsAuthReady(true); }
      } catch (err) {
        if (mountedRef.current) { setLoading(false); setIsAuthReady(true); }
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mountedRef.current) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (event === 'SIGNED_IN' && s?.user) {
        setLoading(false); setIsAuthReady(true);
        fetchProfile(s.user);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null); setMembership(null); setLoading(false); setIsAuthReady(true);
        requestIdRef.current++; fetchProfileRef.current = null;
      } else {
        setLoading(false); setIsAuthReady(prev => prev || true);
      }
    });

    return () => {
      mountedRef.current = false;
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Real-time membership listener - watch for all changes to club_memberships for this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`membership-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "club_memberships",
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refresh profile when membership changes
        refreshProfile();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refreshProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setSession(null); setProfile(null); setMembership(null); setIsAuthReady(true);
    if (user) localStorage.removeItem(`user_role_${user.id}`);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, membership, loading, isAuthReady, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}