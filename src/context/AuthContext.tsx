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
    if (fetchProfileRef.current) return fetchProfileRef.current;

    const currentRequestId = ++requestIdRef.current;
    console.log(`[AuthContext] Fetching profile for: ${currentUser.email} (Request #${currentRequestId})`);
    
    const fetchPromise = (async () => {
      try {
        let profData: any = null;
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .maybeSingle();
        
        if (!error && data) profData = data;

        const metadata = currentUser.user_metadata || {};

        // Auto-create profile if missing
        if (!profData && mountedRef.current) {
          console.log("[AuthContext] Profile missing, creating...");
          const { data: newProf } = await (supabase as any)
            .from("profiles")
            .insert({
              user_id: currentUser.id,
              email: currentUser.email,
              first_name: metadata.first_name || '',
              last_name: metadata.last_name || '',
              school: metadata.school || null,
              section: metadata.section || null,
              grade_level: metadata.grade_level || null,
            })
            .select()
            .single();
          if (newProf) profData = newProf;
        }

        if (currentRequestId !== requestIdRef.current) return;

        // Fetch role and wallet
        const [roleRes, walletRes] = await Promise.all([
          (supabase as any).from("user_roles").select("role").eq("user_id", currentUser.id).maybeSingle(),
          (supabase as any).from("bcoins_wallets").select("balance").eq("user_id", currentUser.id).maybeSingle()
        ]);

        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        const role = roleRes.data?.role || 'customer';
        console.log(`[AuthContext] Profile loaded successfully. Role: ${role}`);

        setProfile({
          id: currentUser.id,
          first_name: profData?.first_name || metadata.first_name || 'Student',
          last_name: profData?.last_name || metadata.last_name || '',
          section: profData?.section || metadata.section || 'N/A',
          grade_level: profData?.grade_level || metadata.grade_level || 'N/A',
          school: profData?.school || metadata.school || 'N/A',
          email: profData?.email || currentUser.email || '',
          avatar_url: profData?.avatar_url || metadata.avatar_url || null,
          bcoins: Number(walletRes.data?.balance || profData?.bcoins || 0),
          role,
        });
      } catch (err) {
        console.warn("[AuthContext] Profile fetch issue:", err);
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
          setIsAuthReady(true);
          fetchProfileRef.current = null;
        }
      }
    })();

    fetchProfileRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Safety timeout: If auth takes more than 8 seconds, force the app to show
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("[AuthContext] Safety timeout triggered - forcing ready state");
        setLoading(false);
        setIsAuthReady(true);
      }
    }, 8000);

    const init = async () => {
      console.log("[AuthContext] Starting initialization...");
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;
        
        setSession(s);
        setUser(s?.user ?? null);
        
        if (s?.user) {
          await fetchProfile(s.user);
        } else {
          setLoading(false);
          setIsAuthReady(true);
        }
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
        setLoading(false);
        setIsAuthReady(true);
      }
    };
    
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log(`[AuthContext] Auth state changed: ${event}`);
      if (!mountedRef.current) return;
      
      setSession(s);
      setUser(s?.user ?? null);
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && s?.user) {
        await fetchProfile(s.user);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        setIsAuthReady(true);
        requestIdRef.current++;
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAuthReady(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      isAuthReady, 
      signOut, 
      refreshProfile: () => user ? fetchProfile(user) : Promise.resolve() 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}