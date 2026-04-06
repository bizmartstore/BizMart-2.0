import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects authenticated admin and guidance users to their respective dashboards 
 * if they land on customer pages.
 */
export default function AdminAutoRedirect() {
  const { user, isAuthReady, profile } = useAuth();
  const { isAdmin, isGuidance } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Block until auth and profile are fully resolved
    if (!isAuthReady || !profile) {
      return;
    }

    // If not an admin or guidance, do nothing
    if (!user || (!isAdmin && !isGuidance)) {
      return;
    }

    // Only redirect from customer-facing pages
    const protectedPaths = ["/admin", "/guidance", "/login", "/signup"];
    const isOnProtectedPath = protectedPaths.some((p) => location.pathname.startsWith(p));

    if (isOnProtectedPath) {
      return;
    }

    if (isAdmin) {
      console.log('[AdminAutoRedirect] Admin detected, redirecting to /admin');
      navigate("/admin", { replace: true });
    } else if (isGuidance) {
      console.log('[AdminAutoRedirect] Guidance detected, redirecting to /guidance');
      navigate("/guidance", { replace: true });
    }
  }, [user, isAdmin, isGuidance, isAuthReady, profile, location.pathname, navigate]);

  return null;
}