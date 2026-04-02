<![CDATA[
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminDashboard() {
  const { isAdmin, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();

  // If not admin, redirect to home
  if (!isAdmin) {
    navigate("/", { replace: true });
    return null;
  }

  // ... existing component code
</dyad-file>

<dyad-write path="src/pages/Index.tsx" description="Prevent fallback to homepage for admin accounts">
  <![CDATA[
import { useAdmin } from "@//hooks/useAdmin";

export default function Index() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = window.location.pathname;

  // If admin is logged in and tries to access home, redirect to admin dashboard
  if (isAdmin && !adminLoading && location.pathname === "/") {
    // Delay redirect slightly to avoid race condition
    setTimeout(() => {
      window.location.href = "/admin";
    }, 100);
    return null;
  }

  // ... existing Index component code
</dyad-file>

<dyad-write path="src/pages/NotFound.tsx" description="Prevent admin from being redirected to not found when accessing admin routes directly">
  <![CDATA[
import { useAdmin } from "@/hooks/useAdmin";

export default function NotFound() {
  const { isAdmin, loading } = useAdmin();
  const location = window.location.pathname;

  // If admin tries to access non-admin page directly, redirect to admin dashboard
  if (isAdmin && !loading && !location.pathname.startsWith("/admin")) {
    window.location.href = "/admin";
    return null;
  }

  // ... existing NotFound component code
</dyad-file>

<dyad-chat-summary>Enforce admin-only routing and prevent fallback to customer account</dyad-chat-summary><dyad-write path="src/pages/LoginPage.tsx" description="Ensure admin login never falls back to customer by storing admin flag and redirecting directly">
  <![CDATA[
import { useLocation } from "react-router-dom";

export default function LoginPage() {
  // ... existing state and effect code ...

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUnconfirmed(false);
    setErrorMsg(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, password 
    });
    
    setLoading(false);
    
    if (error) {
      // ... existing error handling
    } else if (data.user) {
      // Determine role BEFORE any navigation
      const { data: roleData, error: roleError } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();
      
      if (!roleError && roleData?.role) {
        // Store admin status permanently for this session
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("adminRole", roleData.role);
                // Navigate based on role
        if (roleData.role === "main_admin" || roleData.role === "member_admin") {
          navigate("/admin");
          return;
        }
      }
      
      // Existing fallback logic (non-admin)
      if (data.user.email === 'sheethappenswithjaa@gmail.com') {
        navigate("/admin");
        return;
      }
      
      // ... existing non-admin navigation logic
    }
  };
  // ... rest unchanged
</dyad-file>

<dyad-write path="src/components/RequireAdmin.tsx" description="Enhanced guard that blocks non-admin access and redirects to admin dashboard">
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
      // Prevent redirect loops by checking current path
      if (!location.pathname.startsWith("/admin")) {
        navigate("/admin", { replace: true });
      }
    }
  }, [isAdmin, loading, location.pathname, navigate]);

  // Render children only if user IS admin
  return isAdmin ? children : null;
}
]]>