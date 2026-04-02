<![CDATA[
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminAutoRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for both auth and role loading to complete    if (authLoading || roleLoading) {
      return;
    }

    if (!user || !isAdmin) {
      return;
    }

    // Define paths that should be accessible to admins only
    const adminPaths = ["/admin", "/sellers", "/orders", "/print", "/jobs", "/bcoins", "/gcash", "/club", "/settings", "/codes", "/news", "/admin"];
    const isAdminPath = adminPaths.some((p) => location.pathname.startsWith(p));

    // If the current path is NOT an admin‑protected path, redirect to /admin
    if (!isAdminPath) {
      console.log("[AdminAutoRedirect] Redirecting admin to /admin");
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, authLoading, roleLoading, location.pathname, navigate]);
}
]]>