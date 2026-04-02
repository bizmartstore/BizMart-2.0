import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminAutoRedirect() {
  const { role, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (roleLoading) return;
    const adminPaths = ["/admin", "/login", "/signup"];
    if (adminPaths.some((p) => location.pathname.startsWith(p))) return;
    if (role && !role.startsWith("admin")) navigate("/admin", { replace: true });
  }, [role, roleLoading, location.pathname, navigate]);
  
  return null;
}