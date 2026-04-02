<![CDATA[
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to expose admin role information.
 * Prioritizes localStorage flag (set on admin login) for instant recognition,
 * then falls back to profile role from database.
 */
export function useAdmin() {
  const { profile, loading: authLoading } = useAuth();
  
  // Check localStorage first - this persists across page refreshes
  const storedIsAdmin = localStorage.getItem("isAdminLoggedIn") === "true";
  const storedRole = localStorage.getItem("adminRole");
  
  // Determine admin status with priority: localStorage > profile role
  const isAdmin = storedIsAdmin || 
                  profile?.role === "main_admin" || 
                  profile?.role === "member_admin";
  
  const isMainAdmin = profile?.role === "main_admin" || storedRole === "main_admin";
  const isMemberAdmin = profile?.role === "member_admin" || storedRole === "member_admin";

  return {
    role: storedRole || profile?.role || null,
    isAdmin,
    isMainAdmin,
    isMemberAdmin,
    loading: authLoading,
  };
}
]]>