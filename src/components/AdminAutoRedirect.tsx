import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

export default function AdminAutoRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user || !isAdmin) return;

    const adminPaths = ["/admin", "/login", "/signup"];
    if (adminPaths.some((p) => location.pathname.startsWith(p))) return;

    console.log('[AdminAutoRedirect] Redirecting admin to /admin');
    navigate("/admin", { replace: true });
  }, [user, isAdmin, authLoading, roleLoading, location.pathname, navigate]);

  return null;
}