import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects authenticated admin users to /admin if they land on customer pages.
 * Place this inside BrowserRouter.
 */
export function AdminAutoRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user || !isAdmin) return;

    // Only redirect from customer-facing pages, not from admin or auth pages
    const adminPaths = ["/admin", "/login", "/signup"];
    if (adminPaths.some((p) => location.pathname.startsWith(p))) return;

    navigate("/admin", { replace: true });
  }, [user, isAdmin, authLoading, roleLoading, location.pathname, navigate]);

  return null;
}