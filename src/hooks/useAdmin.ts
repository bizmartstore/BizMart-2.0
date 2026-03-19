import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    
    // Superuser override for the owner
    if (user.email === 'sheethappenswithjaa@gmail.com') {
      setRole('main_admin');
      setLoading(false);
      return;
    }

    (supabase as any).rpc('get_user_role', { _user_id: user.id })
      .then(({ data }: any) => {
        setRole(data);
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