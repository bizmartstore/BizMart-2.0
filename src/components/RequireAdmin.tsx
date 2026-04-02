<![CDATA[
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

/**
 * Component to wrap admin-only routes.
 * If user is not admin, redirect to home with a message.
 */
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!isAdmin) {
      // Clear any admin flags if user is not actually admin
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("adminRole");
      
      // Redirect to home with a flag to show access denied
      navigate("/", { replace: true, state: { accessDenied: true } });
    }
  }, [isAdmin, loading, location.pathname, navigate]);

  // Only render children if user IS admin
  if (!isAdmin && !loading) {
    return null;
  }

  return <>{children}</>;
}
]]>