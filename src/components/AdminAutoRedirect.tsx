import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects authenticated admin users to /admin if they land on customer pages.
 * Only evaluates after isAuthReady is true to prevent race conditions.
 */
export default function AdminAutoRedirect() {
  const { user, isAuthReady } = useAuth();
  const { isAdmin } = useAdmin();
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

    // Only redirect from customer-facing pages, not from admin or auth pages
    const adminPaths = ["/admin", "/login", "/signup"];
    if (adminPaths.some((p) => location.pathname.startsWith(p))) {
      return;
    }

    console.log('[AdminAutoRedirect] Redirecting admin to /admin. User role:', role);
    navigate("/admin", { replace: true });
  }, [user, isAdmin, isAuthReady, location.pathname, navigate, role]);

  return null;
}