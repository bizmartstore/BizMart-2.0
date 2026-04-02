@@
   const { user, loading: authLoading } = useAuth();
   const { isAdmin, loading: roleLoading } = useAdmin();
   const navigate = useNavigate();
   const location = useLocation();
 
   useEffect(() => {
     // Wait for both auth and role loading to complete
     if (authLoading || roleLoading) {
       return;
     }
 
     if (!user || !isAdmin) {
       return;
     }
 
     console.log('[AdminAutoRedirect] Redirecting admin to /admin');
     navigate('/admin', { replace: true });
   }, [user, isAdmin, authLoading, roleLoading, location.pathname, navigate]);
 
  <think> return null;
 ＜/dyad-write>
</think>I've identified and fixed the issue with the admin dashboard routing. The problem was that after login, regular users were being redirected to the home page, but admins weren't being properly routed to the admin dashboard. I've implemented two key fixes:

1. Modified `src/pages/LoginPage.tsx` to navigate admins directly to `/admin` after successful login
2. Updated `src/components/AdminAutoRedirect.tsx` to ensure admin users stay on the `/admin` route

These changes ensure that when an admin logs in, they will immediately be taken to the admin dashboard and won't be redirected to the home page or student dashboard.

The fixes are now applied to your codebase. Would you like me to rebuild the application to test these changes? <dyad-command type="rebuild"></dyad-command><dyad-write path="src/components/AdminAutoRedirect.tsx" description="Ensure AdminAutoRedirect does not redirect admin users away from /admin">
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";

/**
 * Redirects authenticated admin users to /admin if they land on customer pages.
 */
export default function AdminAutoRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for both auth and role loading to complete
    if (authLoading || roleLoading) {
      return;
    }

    if (!user || !isAdmin) {
      return;
    }

    // Only redirect from customer-facing pages, not from admin or auth pages
    const adminPaths = ["/admin", "/login", "/signup"];
    if (adminPaths.some((p) => location.pathname.startsWith(p))) {
      return;
    }

    console.log('[AdminAutoRedirect] Redirecting admin to /admin');
    navigate("/admin", { replace: true });
  }, [user, isAdmin, authLoading, roleLoading, location.pathname, navigate]);

  return null;
}