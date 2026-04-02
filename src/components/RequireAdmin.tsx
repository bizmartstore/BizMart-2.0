<![CDATA[
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

/**
 * Component to wrap admin-only routes.
 * If user is not admin, redirect to admin dashboard.
 */
export default function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    // Check if user is NOT admin (including case where role might be missing)
    if (!isAdmin) {
      // Prevent redirect loops by checking current path      if (!location.pathname.startsWith("/admin")) {
        navigate("/admin", { replace: true });
      }
    }
  }, [isAdmin, loading, location.pathname, navigate]);

  // Render children only if user IS admin  return isAdmin ? children : null;
}
]]>