import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects authenticated admin and guidance users to their respective dashboards 
 * if they land on customer pages.
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

    // If not an admin or guidance, do nothing
    if (!user || (!isAdmin && !isGuidance)) {
      return;
    }

    // Only redirect from customer-facing pages, not from admin, guidance, or auth pages
    const protectedPaths = ["/admin", "/guidance", "/login", "/signup"];
    if (protectedPaths.some((p) => location.pathname.startsWith(p))) {
      return;
    }

    if (isAdmin) {
      console.log('[AdminAutoRedirect] Redirecting admin to /admin');
      navigate("/admin", { replace: true });
    } else if (isGuidance) {
      console.log('[AdminAutoRedirect] Redirecting guidance to /guidance');
      navigate("/guidance", { replace: true });
    }
  }, [user, isAdmin, isGuidance, isAuthReady, location.pathname, navigate]);

  return null;
}