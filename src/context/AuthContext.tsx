...
＜/dyad-write>
<dyad-chat-summary>Fixed roleData null check＜/dyad-chat-summary>
All good. 
Let's produce the response. 
Wait, let's verify the exact line in the provided code:
```typescript
      const finalProfile = mapToProfile(profileData ?? {});
      const role = roleData?.role;
      if (role) {
        finalProfile.role = role;
      }
```
I will change it to:
```typescript
      const finalProfile = mapToProfile(profileData ?? {});
      if (roleData && roleData.role) {
        finalProfile.role = roleData.role;
      }
```
This resolves TS18047.
Done. 
Output matches. 
Proceeds. 
[Self-Correction/Verification during thought]
Is there any chance `roleData` is typed as `never`? In the previous prompt, error 4 & 5 said `Property 'role' does not exist on type 'never'`. That was fixed by typing or casting. But now it says `'roleData' is possibly 'null'`.
I'll just use a safe explicit check.
```typescript
      const finalProfile = mapToProfile(profileData ?? {});
      if (roleData) {
        finalProfile.role = roleData.role || "customer";
      }
```
This is robust.
I will generate the full file to be safe.
All set. 
Output matches response. 
Proceeds. 
[Output Generation] -> *Proceeds*</think><dyad-write path="src/context/AuthContext.tsx" description="Fixing roleData null check to resolve TS18047">
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  section: string;
  grade_level: string;
  school: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);

      const { data: profileData, error: profileError } = profileRes;
      const { data: roleData, error: roleError } = roleRes;

      if (profileError) throw profileError;
      if (roleError && roleError.code !== "PGRST116") throw roleError;

      const mapToProfile = (record: any): Profile => ({
        id: record.id ?? "",
        user_id: userId,
        first_name: record.first_name ?? "",
        last_name: record.last_name ?? "",
        section: record.section ?? "",
        grade_level: record.grade_level ?? "",
        school: record.school ?? "",
        email: record.email ?? "",
        avatar_url: record.avatar_url ?? null,
        role: record.role ?? "customer",
      });

      const finalProfile = mapToProfile(profileData ?? {});
      if (roleData && roleData.role) {
        finalProfile.role = roleData.role;
      }
      setProfile(finalProfile);
    } catch (err) {
      console.error("[AuthContext] Profile fetch error:", err);
      setProfile({
        id: "",
        user_id: userId,
        first_name: "",
        last_name: "",
        section: "",
        grade_level: "",
        school: "",
        email: "",
        avatar_url: null,
        role: "customer",
      });
    }
  };

  useEffect(() => {
    const currentProjectUrl = import.meta.env.VITE_SUPABASE_URL;
    const lastProjectUrl = localStorage.getItem("last_supabase_url");

    if (lastProjectUrl && lastProjectUrl !== currentProjectUrl) {
      console.warn("[AuthContext] Supabase project changed! Clearing old session...");
      supabase.auth.signOut();
      localStorage.clear();
      localStorage.setItem("last_supabase_url", currentProjectUrl);
      window.location.reload();
      return;
    }

    localStorage.setItem("last_supabase_url", currentProjectUrl);

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] Auth event: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Restore session on app load
    supabase.auth.getSession().then(async ({ data, error }) => {
      const session = data?.session ?? null;
      if (error) {
        console.error("[AuthContext] Session error:", error);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem("supabase.auth.token");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}