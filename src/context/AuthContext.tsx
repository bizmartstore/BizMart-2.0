import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/* --------------------------------------------------------------------- */
/*  Types                                                               */
/* --------------------------------------------------------------------- */
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

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/* --------------------------------------------------------------------- */
/*  Context creation                                                    */
/* --------------------------------------------------------------------- */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* --------------------------------------------------------------------- */
/*  Provider                                                             */
/* --------------------------------------------------------------------- */
export function AuthProvider({ children }: { children: ReactNode }) {
  /* ---------- State --------------------------------------------------- */
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------- Ref to keep track of un‑mounted state ------------------- */
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  /* ---------- Helper: load profile once we know a user ----------------------- */
  const loadProfile = useCallback(async (currentUser: User) => {
    if (!mountedRef.current) return;

    try {
      // 1️⃣ Try to fetch an existing profile row
      const { data: profData, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      // 2️⃣ If it does not exist, create a minimal one (prevents later errors)
      if (!profData) {
        const { data: created, error: createErr } = await supabase
          .from("profiles")
          .insert({
            id: currentUser.id,
            email: currentUser.email,
            first_name: currentUser.user_metadata?.first_name ?? "",
            last_name: currentUser.user_metadata?.last_name ?? "",
            school: currentUser.user_metadata?.school ?? "",
            grade_level: currentUser.user_metadata?.grade_level ?? "",
            section: currentUser.user_metadata?.section ?? "",
            avatar_url: currentUser.user_metadata?.avatar_url ?? null,
            bcoins: 0,
          })
          .select()
          .single();

        if (createErr) throw createErr;
        setProfile(created as Profile);
        return;
      }

      // 3️⃣ Pull role from the user_roles table (fallback to "customer")
      const { data: roleData, error: roleErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .single();

      // 4️⃣ Pull BCoins balance (optional but handy)
      const { data: wallet, error: walletErr } = await supabase
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", currentUser.id)
        .single();

      const finalProfile: Profile = {
        id: currentUser.id,
        first_name: profData?.first_name ?? currentUser.user_metadata?.first_name ?? "",
        last_name: profData?.last_name ?? currentUser.user_metadata?.last_name ?? "",
        section: profData?.section ?? currentUser.user_metadata?.section ?? "",
        grade_level: profData?.grade_level ?? currentUser.user_metadata?.grade_level ?? "",
        school: profData?.school ?? currentUser.user_metadata?.school ?? "",
        email: profData?.email ?? currentUser.email ?? "",
        avatar_url: profData?.avatar_url ?? currentUser.user_metadata?.avatar_url ?? null,
        bcoins: Number(wallet?.balance ?? profData?.bcoins ?? 0),
        role: roleData?.role ?? "customer",
      };

      setProfile(finalProfile);
    } catch (e: any) {
      console.warn("[AuthContext] Profile load error:", e.message);
    }
  }, []);

  /* ---------- Initialise – run once ----------------------------------- */
  useEffect(() => {
    // Supabase will give us the *initial* session (may be null on first load)
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setSession(session);
          await loadProfile(session.user);
        }
      } catch (e) {
        console.error("[AuthProvider] Session fetch failed:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  /* ---------- Real‑time listener -------------------------------------- */
  useEffect(() => {
    if (!user) return; // no session → nothing to listen to
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mountedRef.current) return;

        // Update local state
        setUser(newSession?.user ?? null);
        setSession(newSession);

        // Refresh profile whenever the user changes
        await loadProfile(newSession?.user ?? null);
      }
    );

    // Cleanup – crucial! prevents the endless listener that caused the freeze
    return () => {
      mountedRef.current = false;
      subscription?.remove();
    };
  }, [user]);

  /* ---------- Sign‑out ------------------------------------------------ */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  /* ---------- Expose helpers ------------------------------------------ */
  const refreshProfile = useCallback(loadProfile, []);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* --------------------------------------------------------------------- */
/*  Hook for consuming components                                        */
/* --------------------------------------------------------------------- */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}