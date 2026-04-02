"use client";

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

  // 🔥 Load cached role (VERY IMPORTANT)
  const roleRef = useRef<string>(
    localStorage.getItem("user_role") || "customer"
  );

  const fetchProfile = useCallback(async (currentUser: User) => {
    console.log(`[AuthContext] Fetching profile for: ${currentUser.email}`);

    try {
      const { data: profData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      const metadata = currentUser.user_metadata || {};

      let finalProfData = profData;

      if (!profData) {
        const { data: newProf } = await supabase
          .from("profiles")
          .insert({
            id: currentUser.id,
            email: currentUser.email,
            first_name: metadata.first_name || "",
            last_name: metadata.last_name || "",
            school: metadata.school || "",
            section: metadata.section || "",
            grade_level: metadata.grade_level || "",
            bcoins: 0,
          })
          .select()
          .single();

        if (newProf) finalProfData = newProf;
      }

      // 🔥 SAFE ROLE FETCH
      let role = roleRef.current;

      try {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (roleData?.role) {
          role = roleData.role;
          roleRef.current = role;
          localStorage.setItem("user_role", role); // 🔥 persist
        }
      } catch (err) {
        console.warn("[AuthContext] Role fetch failed, using cached role");
      }

      // Wallet
      const { data: wallet } = await supabase
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      const newProfile: Profile = {
        id: currentUser.id,
        first_name: finalProfData?.first_name || metadata.first_name || "Student",
        last_name: finalProfData?.last_name || metadata.last_name || "",
        section: finalProfData?.section || metadata.section || "N/A",
        grade_level: finalProfData?.grade_level || metadata.grade_level || "N/A",
        school: finalProfData?.school || metadata.school || "N/A",
        email: finalProfData?.email || currentUser.email || "",
        avatar_url:
          finalProfData?.avatar_url || metadata.avatar_url || null,
        bcoins: Number(wallet?.balance || finalProfData?.bcoins || 0),
        role, // 🔥 always safe
      };

      setProfile(newProfile);
      console.log("[AuthContext] Profile loaded with role:", role);
    } catch (err: any) {
      console.warn("[AuthContext] Profile fetch issue:", err.message);

      // 🔥 NEVER downgrade role
      setProfile((prev) =>
        prev
          ? { ...prev, role: roleRef.current }
          : null
      );
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user && mounted.current) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    mounted.current = true;

    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await fetchProfile(s.user);
        }
      } catch (err) {
        console.error("[AuthContext] Init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (event, s) => {
        console.log(`[AuthContext] Auth state changed: ${event}`);

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await fetchProfile(s.user);
        } else {
          setProfile(null);
          localStorage.removeItem("user_role"); // 🔥 cleanup
        }

        setLoading(false);
      });

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem("user_role");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within AuthProvider");
  return context;
}