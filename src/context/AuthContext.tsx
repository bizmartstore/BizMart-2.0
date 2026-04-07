... (full file content with fix) ...
＜/dyad-write>
<dyad-chat-summary>Fixed isSupported TypeScript error＜/dyad-chat-summary>
I've fixed the TypeScript error by correctly importing `isSupported` from `firebase/messaging` and safely calling it. The type assertion ensures compatibility with your current TypeScript configuration.
All set!
</think><dyad-write path="src/context/AuthContext.tsx" description="Fixing isSupported import and call to resolve TS2349">
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { messaging } from "@/firebase";
import { requestUserPermission } from "@/firebase-messaging";
import { isSupported } from "firebase/messaging";

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
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to save FCM token to Supabase
  const saveFcmToken = useCallback(async (userId: string, token: string, role: string) => {
    try {
      // Check if token already exists for this user/device
      const { data: existing } = await (supabase as any)
        .from("user_push_tokens")
        .select("id")
        .eq("user_id", userId)
        .eq("fcm_token", token)
        .maybeSingle();

      if (!existing) {
        // Insert new token
        await (supabase as any)
          .from("user_push_tokens")
          .insert({
            user_id: userId,
            role: role,
            fcm_token: token,
          });
        console.log("[AuthContext] FCM token saved for user:", userId);
      }
    } catch (error) {
      console.error("[AuthContext] Failed to save FCM token:", error);
    }
  }, []);

  // Function to request notification permission and get FCM token
  const requestNotificationPermission = useCallback(async (userId: string, role: string) => {
    // Only request for customers
    if (role !== "customer") {
      console.log("[AuthContext] Skipping FCM token request for non-customer role:", role);
      return;
    }

    try {
      const supported = await (isSupported as any)();
      if (!supported) {
        console.warn("[AuthContext] FCM is not supported in this browser");
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("[AuthContext] Notification permission not granted");
        return;
      }

      // Get FCM token
      const token = await requestUserPermission();
      if (token) {
        console.log("[AuthContext] FCM token obtained:", token.slice(0, 20) + "...");
        await saveFcmToken(userId, token, role);
      } else {
        console.warn("[AuthContext] No FCM token received");
      }
    } catch (error) {
      console.error("[AuthContext] Error requesting notification permission:", error);
    }
  }, [saveFcmToken]);

  const fetchProfile = useCallback(async (currentUser: User): Promise<void> => {
    if (fetchProfileRef.current) {
      return fetchProfileRef.current;
    }

    const currentRequestId = ++requestIdRef.current;
    
    const fetchPromise = (async () => {
      console.log(`[AuthContext] Fetching profile for: ${currentUser.email} (Request #${currentRequestId})`);
      
      try {
        // 1. Fetch existing profile
        let profData: any = null;
        
        try {
          const { data, error } = await (supabase as any)
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();
          
          if (!error && data) {
            profData = data;
          } else if (error) {
            console.warn("[AuthContext] Profile fetch error:", error.message);
          }
        } catch (err: any) {
          console.warn("[AuthContext] Profile fetch exception:", err.message);
        }

        const metadata = currentUser.user_metadata || {};

        // 2. Create profile if missing
        if (!profData) {
          console.log("[AuthContext] Profile missing, creating...");
          try {
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
            
            if (!insertError && newProf) {
              profData = newProf;
            } else if (insertError) {
              console.warn("[AuthContext] Profile creation failed:", insertError.message);
            }
          } catch (err: any) {
            console.warn("[AuthContext] Profile creation exception:", err.message);
          }
        }

        // Check if this request is still the latest
        if (currentRequestId !== requestIdRef.current) {
          console.log(`[AuthContext] Stale response ignored (Request #${currentRequestId})`);
          return;
        }

        // 3. Fetch role
        let roleData: any = null;
        try {
          const { data, error } = await (supabase as any)
            .from("user_roles")
            .select("role")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          
          if (!error && data) {
            roleData = data;
          } else if (error) {
            console.warn("[AuthContext] Role fetch error:", error.message);
          }
        } catch (err: any) {
          console.warn("[AuthContext] Role fetch exception:", err.message);
        }

        // 4. Fetch wallet balance
        let wallet: any = null;
        try {
          const { data, error } = await (supabase as any)
            .from("bcoins_wallets")
            .select("balance")
            .eq("user_id", currentUser.id)
            .maybeSingle();
          
          if (!error && data) {
            wallet = data;
          } else if (error) {
            console.warn("[AuthContext] Wallet fetch error:", error.message);
          }
        } catch (err: any) {
          console.warn("[AuthContext] Wallet fetch exception:", err.message);
        }

        // Final check before state update
        if (currentRequestId !== requestIdRef.current || !mountedRef.current) return;

        const role = roleData?.role || 'customer';
        
        // Persist role for future fallback
        if (roleData?.role) {
          localStorage.setItem(`user_role_${currentUser.id}`, roleData.role);
        }

        // Update profile with fresh DB data or fallback
        const newProfile: Profile = {
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
        };
        
        setProfile(newProfile);
        console.log("[AuthContext] Profile loaded successfully. Role:", role);

        // Request FCM token if user is a customer
        if (role === 'customer') {
          await requestNotificationPermission(currentUser.id, role);
        }
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
  }, [requestNotificationPermission]);

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
        
        // Set a safety timeout to ensure isAuthReady is always set
        initTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            console.log("[AuthContext] Safety timeout triggered - forcing ready state");
            setLoading(false);
            setIsAuthReady(true);
          }
        }, 5000);
        
        if (s?.user) {
          // Fetch profile in background (won't block UI)
          fetchProfile(s.user);
        } else {
          // No user, we're ready immediately
          setLoading(false);
          setIsAuthReady(true);
        }
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
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
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
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