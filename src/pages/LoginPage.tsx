<![CDATA[
    // ... existing imports
    import { useLocation } from "react-router-dom";

    // Inside handleLogin after role check:
    if (roleData === "main_admin" || roleData === "member_admin") {
      // Store admin flag to prevent fallback
      localStorage.setItem("isAdminLoggedIn", "true");
      // Also store role for later checks
      localStorage.setItem("adminRole", roleData);
      navigate("/admin");
      return;
    }
    // Existing fallback logic unchanged
    if (data.user.email === 'sheethappenswithjaa@gmail.com') {
      navigate("/admin");
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      // ... existing error handling
    } else {
      // ... existing success handling
    }
  ], [];
</dyad-file>

<dyad-write path="src/components/RequireAdmin.tsx" description="Create a route guard that ensures only admin can access admin routes">
  <![CDATA[
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

/**
 * Component to wrap admin-only routes.
 * If user is not admin, redirect to home.
 */
export default function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, loading, location.pathname, navigate]);

  return children;
}
]]>