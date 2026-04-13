import { useAuth } from "@/context/AuthContext";

export function useAdmin() {
  const { role, isAuthReady } = useAuth();

  return {
    role,
    isAdmin: isAuthReady && !!role && (role === 'main_admin' || role === 'member_admin'),
    isMainAdmin: isAuthReady && !!role && role === 'main_admin',
    isMemberAdmin: isAuthReady && !!role && role === 'member_admin',
    loading: !isAuthReady,
  };
}