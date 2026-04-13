import { useAuth } from "@/context/AuthContext";

export function useAdmin() {
  const { profile, isAuthReady } = useAuth();
  const role = profile?.role || null;

  return {
    role,
    isAdmin: isAuthReady && (role === 'main_admin' || role === 'member_admin'),
    isMainAdmin: isAuthReady && role === 'main_admin',
    isMemberAdmin: isAuthReady && role === 'member_admin',
    loading: !isAuthReady,
  };
}