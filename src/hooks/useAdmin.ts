import { useAuth } from "@/context/AuthContext";

export function useAdmin() {
  const { profile, loading: authLoading } = useAuth();

  const role = profile?.role ?? null;

  // 🔥 IMPORTANT: wait until profile is fully loaded
  const loading = authLoading || !profile;

  return {
    role,
    isAdmin: role === "main_admin" || role === "member_admin",
    isMainAdmin: role === "main_admin",
    isMemberAdmin: role === "member_admin",
    loading,
  };
}