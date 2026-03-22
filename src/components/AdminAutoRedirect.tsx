import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects authenticated admin users to /admin if they land on customer pages.
 * Place this inside BrowserRouter.
 */
export default function AdminAutoRedirect() {
  const { user, profile } = useAuth(); // ✅ Get profile
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) return;

    // Only redirect from customer-facing pages, not from admin or auth pages
    const adminPaths = ["/admin", "/login", "/signup"];
    if (adminPaths.some((p) => location.pathname.startsWith(p))) return;

    navigate("/admin", { replace: true });
  }, [user, isAdmin, loading, location.pathname, navigate]);

  return null;
}