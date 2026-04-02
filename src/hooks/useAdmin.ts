import { useAuth } from "@/context/AuthContext";

export function useAdmin() {
  const { profile, loading } = useAuth();
  const isAdmin = profile?.role === "main_admin" || profile?.role === "member_admin";
  const isMainAdmin = profile?.role === "main_admin";
  return { isAdmin, isMainAdmin, loading };
}