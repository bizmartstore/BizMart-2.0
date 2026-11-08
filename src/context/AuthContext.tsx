"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserRecords, isProfileComplete } from "@/lib/auth";

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
  /** True once the profile row (if any) has finished loading for the current user. */
  profileLoading: boolean;
  /** True when the student has filled in all one-time setup fields. */
  profileComplete: boolean;
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
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  
  const fetchProfileRef = useRef<Promise<void> | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (currentUser: User): Promise<void> => {
    if (fetchProfileRef.current) return fetchProfileRef.current;
    const currentRequestId = ++requestIdRef.current;
    
    const fetchPromise = (async () => {
      setProfileLoading(true);
      try {
        // 0. Ensure the user has a profile + wallet in the database
        await ensureUserRecords(currentUser);

        // 1. Fetch Profile (match on user_id; fall back to id for legacy rows)
        const { data: profData } = await (supabase as any).from("profiles").select("*")
          .or(`user_id.eq.${currentUser.id},id.eq.${currentUser.id}`)
          .maybeSingle();

        // 2. Fetch Role (prioritize user_roles, fall back to profiles.role for legacy users)
        const { data: roleData } = await (supabase as any).from("user_roles").select("role").eq("user_id", currentUser.id).maybeSingle();
        const role = roleData?.role || profData?.role || 'customer';

        // 3. Fetch Wallet
        const { data: wallet } = await (supabase as any).from("bcoins_wallets").select("balance").eq("user_id", currentUser.id).maybeSingle();

        // 4. Fetch Membership
        const { data: memData } = await (supabase as any).from("club_memberships").select("*").eq("user_id", currentUser.id).eq("status", "active").maybeSingle();

        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        if (roleData?.role || profData?.role) localStorage.setItem(`user_role_${currentUser.id}`, role);

        setMembership(memData);
        setProfileComplete(isProfileComplete(profData));
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
        if (mountedRef.current && currentRequestId === requestIdRef.current) {
          setProfileLoading(false);
        }
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
    let isMounted = true;
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
        setIsAuthReady(true);
        if (s?.user) {
          fetchProfile(s.user);
        } else {
          setProfileLoading(false);
          setProfileComplete(false);
        }
      } catch (err) {
        console.warn("[AuthContext] init error:", err);
        if (isMounted) {
          setLoading(false);
          setIsAuthReady(true);
          setProfileLoading(false);
          setProfileComplete(false);
        }
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
        setProfileComplete(false); setProfileLoading(false);
        requestIdRef.current++; fetchProfileRef.current = null;
      } else {
        setLoading(false); setIsAuthReady(prev => prev || true);
        if (!s?.user) {
          setProfileComplete(false);
          setProfileLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Real-time membership listener
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`membership-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "club_memberships", filter: `user_id=eq.${user.id}` }, () => refreshProfile())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, refreshProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setSession(null); setProfile(null); setMembership(null); setIsAuthReady(true);
    setProfileComplete(false); setProfileLoading(false);
    if (user) localStorage.removeItem(`user_role_${user.id}`);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, membership, loading, isAuthReady, profileLoading, profileComplete, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}