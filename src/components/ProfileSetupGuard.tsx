import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

/**
 * Ensures students finish the one-time profile setup after their first
 * Google sign-in. Completed profiles (including accounts created before
 * Google sign-in was introduced) are never asked again, even after the
 * app is uninstalled and reinstalled, because completion is stored in
 * the database.
 */
export default function ProfileSetupGuard() {
  const { user, profileLoading, profileComplete, isAuthReady } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthReady || !user || profileLoading) return;

    const onSetupPage = location.pathname === "/setup-profile";

    // Admin / guidance accounts do not need student fields; AdminAutoRedirect
    // takes them to their dashboard.
    if (isAdmin) return;

    if (!profileComplete && !onSetupPage) {
      navigate("/setup-profile", { replace: true });
    } else if (profileComplete && onSetupPage) {
      navigate("/", { replace: true });
    }
  }, [isAuthReady, user, profileLoading, profileComplete, isAdmin, location.pathname, navigate]);

  return null;
}
