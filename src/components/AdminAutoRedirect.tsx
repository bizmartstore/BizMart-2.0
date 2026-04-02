import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminAutoRedirect() {
  const { role, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for both role loading to complete
    if (roleLoading) {
      return;
    }

    // Prevent redirect from admin pages
    const adminPaths = ["/admin", "/login", "/signup"];
    if (adminPaths.some((p) => location.pathname.startsWith(p))) {
      return;
    }

    // Only redirect non-admin users
    if (!role) {
      return;
    }

    console.log("[AdminAutoRedirect] Redirecting non-admin to /admin");
    navigate("/admin", { replace: true });
  }, [role, roleLoading, location.pathname, navigate]);
}