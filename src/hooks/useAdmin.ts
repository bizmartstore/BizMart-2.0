import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const { user, profile } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // ✅ Use profile.role from AuthContext (already fetched)
    if (profile?.role) {
      // Superuser override (kept for backward compatibility)
      if (user.email === "sheethappenswithjaa@gmail.com") {
        setRole("main_admin");
      } else {
        setRole(profile.role);
      }
      setLoading(false);
      return;
    }

    // Fallback: fetch role from database if profile not loaded yet
    (supabase as any).rpc("get_user_role", { _user_id: user.id })
      .then(({ data, error }: any) => {
        if (error) {
          console.error("Role check error:", error);
          setRole(null);
        } else {
          setRole(data || "customer");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Role check failed:", error);
        setRole(null);
        setLoading(false);
      });
  }, [user, profile]);

  return {
    role,
    isAdmin: role === "main_admin" || role === "member_admin",
    isMainAdmin: role === "main_admin",
    isMemberAdmin: role === "member_admin",
    loading,
  };
}