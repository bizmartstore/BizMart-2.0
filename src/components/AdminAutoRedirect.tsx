import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects authenticated admin users to /admin if they land on customer pages.
 * Uses the new non-blocking role system.
 */
export default function AdminAutoRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) {
      return;
    }

    if (!user || !isAdmin) {
      return;
    }

    // Only redirect from customer-facing pages, not from admin or auth pages
    const adminPaths = ["/admin", "/login", "/signup"];
    if (adminPaths.some((p) => location.pathname.startsWith(p))) {
      return;
    }

    console.log('[AdminAutoRedirect] Redirecting admin to /admin');
    navigate("/admin", { replace: true });
  }, [user, isAdmin, authLoading, location.pathname, navigate]);

  return null;
}