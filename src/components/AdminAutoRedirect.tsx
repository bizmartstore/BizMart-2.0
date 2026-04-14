import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects authenticated admin users to /admin or /guidance if they land on customer pages.
 * Only evaluates after isAuthReady is true to prevent race conditions.
 */

export default function AdminAutoRedirect() {
  const { user, isAuthReady } = useAuth();
  const { isAdmin, isGuidance } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Block until auth and profile are fully resolved
    if (!isAuthReady) {
      return;
    }

    // If not an admin, do nothing
    if (!user || !isAdmin) {
      return;
    }

    // List of paths that should not trigger a redirect
    const adminPaths = ["/admin", "/guidance", "/login", "/signup", "/e-support/track"];

    // Only redirect from customer-facing pages, not from admin, guidance, or auth pages
    const shouldRedirect = !adminPaths.some((p) => location.pathname.startsWith(p));

    if (shouldRedirect) {
      // Redirect to the correct dashboard based on role
      const targetPath = isGuidance ? "/guidance" : "/admin";
      console.log('[AdminAutoRedirect] Redirecting admin to', targetPath);
      navigate(targetPath, { replace: true });
    }
  }, [user, isAdmin, isGuidance, isAuthReady, location.pathname, navigate]);

  return null;
}
