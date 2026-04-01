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
      setRole(null);
      return;
    }

    // Superuser override - check email first
    if (user.email === 'sheethappenswithjaa@gmail.com') {
      console.log('[useAdmin] Superuser detected via email, setting main_admin');
      setRole('main_admin');
      setLoading(false);
      return;
    }

    // Check user role from database
    const checkRole = async () => {
      try {
        // First try the RPC function
        const { data, error } = await (supabase as any).rpc('get_user_role', { _user_id: user.id });
        
        if (error) {
          console.error('[useAdmin] RPC error:', error);
          
          // Fallback: direct query to user_roles table
          const { data: roleData, error: roleError } = await (supabase as any)
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();
            
          if (roleError || !roleData) {
            console.error('[useAdmin] Direct query failed:', roleError);
            setRole(null);
          } else {
            console.log('[useAdmin] Role from direct query:', roleData.role);
            setRole(roleData.role);
          }
        } else {
          console.log('[useAdmin] Role from RPC:', data);
          setRole(data);
        }
      } catch (err) {
        console.error('[useAdmin] Role check failed:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [user]);

  return {
    role,
    isAdmin: role === 'main_admin' || role === 'member_admin',
    isMainAdmin: role === 'main_admin',
    isMemberAdmin: role === 'member_admin',
    loading,
  };
}