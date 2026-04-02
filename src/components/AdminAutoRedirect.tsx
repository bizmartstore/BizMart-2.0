<![CDATA[
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Component that automatically redirects admin users to /admin
 * when they try to access public pages.
 * Place this in App.tsx inside BrowserRouter but before Routes.
 */
export default function AdminAutoRedirect() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only run when both auth and admin checks are complete
    if (authLoading || adminLoading) return;

    // If user is admin and trying to access a non-admin page, redirect to /admin
    if (isAdmin && user && !location.pathname.startsWith("/admin")) {
      // Exclude auth pages from redirect
      const excludedPaths = ["/login", "/signup"];
      if (!excludedPaths.includes(location.pathname)) {
        console.log(`[AdminAutoRedirect] Admin on ${location.pathname}, redirecting to /admin`);
        navigate("/admin", { replace: true });
      }
    }
  }, [isAdmin, user, adminLoading, authLoading, location.pathname, navigate]);

  return null;
}
]]>