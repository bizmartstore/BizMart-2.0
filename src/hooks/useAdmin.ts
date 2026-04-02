import { useAuth } from "@/context/AuthContext";

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const role = user?.role || null;
  return {
    role,
    isAdmin: role === "main_admin" || role === "member_admin",
    isMainAdmin: role === "main_admin",
    isMemberAdmin: role === "member_admin",
    loading: authLoading,
  };
}