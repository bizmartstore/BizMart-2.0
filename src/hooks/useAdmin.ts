<![CDATA[
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to expose admin role information.
 * Uses stored localStorage flag if present (set on admin login) 
 * otherwise falls back to role from profile.
 */
export function useAdmin() {
  const { profile, loading: authLoading } = useAuth();
  
  // Check localStorage first - this persists across page refreshes
  const storedAdminFlag = localStorage.getItem("isAdminLoggedIn");
  const roleFromStorage = storedAdminFlag === "true";
  
  // Use role from storage if admin flag is set, otherwise fall back to profile role
  const role = storedAdminFlag === "true" 
    ? storedAdminFlag 
    : (profile?.role || null);
  
  return {
    role,
    isAdmin: storedAdminFlag === "true" || (profile?.role === "main_admin" || profile?.role === "member_admin"),
    isMainAdmin: profile?.role === "main_admin",
    isMemberAdmin: profile?.role === "member_admin",
    loading: authLoading,
  };
}
]]>