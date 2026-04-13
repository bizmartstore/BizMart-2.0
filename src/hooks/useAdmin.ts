import { useAuth } from "@/context/AuthContext";

export function useAdmin() {
  const { isAuthReady } = useAuth();

  return {
    isAdmin: isAuthReady,
    isMainAdmin: false,
    isMemberAdmin: false,
    loading: !isAuthReady,
  };
}