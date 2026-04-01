import { useAuth } from "@/context/AuthContext";

/**
 * Single source of truth for role-based logic.
 * Derives role directly from AuthContext.profile.role.
 * NEVER performs extra RPC calls or blocks rendering.
 */
export function useAdmin() {
  const { profile } = useAuth();

  // Fallback to "customer" if profile or role is missing
  const role = profile?.role ?? "customer";
  const isAdmin = role === "main_admin" || role === "member_admin";

  return {
    role,
    isAdmin,
    loading: false, // Always false. UI should only block on AuthContext.loading
  };
}