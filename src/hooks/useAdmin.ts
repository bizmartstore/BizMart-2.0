import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { 
      setLoading(false);
      return; 
    }
    
    // Superuser override
    if (user.email === 'sheethappenswithjaa@gmail.com') {
      setRole('main_admin');
      setLoading(false);
      return;
    }

    // Check user role from database
    (supabase as any).rpc('get_user_role', { _user_id: user.id })
      .then(({ data, error }: any) => {
        if (error) {
          console.error("Role check error:", error);
          setRole(null);
        } else {
          setRole(data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Role check failed:", error);
        setRole(null);
        setLoading(false);
      });
  }, [user]);

  return {
    role,
    isAdmin: role === 'main_admin' || role === 'member_admin',
    isMainAdmin: role === 'main_admin',
    isMemberAdmin: role === 'member_admin',
    loading,
  };
}