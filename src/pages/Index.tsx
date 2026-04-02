<![CDATA[
import { useAdmin } from "@/hooks/useAdmin";

export default function Index() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = window.location.pathname;

  // If admin is logged in and tries to access home, redirect to admin dashboard
  if (isAdmin && !adminLoading && location.pathname === "/") {
    // Use timeout to avoid race conditions
    setTimeout(() => {
      window.location.href = "/admin";
    }, 100);
    return null;
  }

  // ... existing Index component code
</dyad-file>

<dyad-write path="src/pages/NotFound.tsx" description="Block admin from accessing 404 when trying to reach admin routes">
  <![CDATA[
import { useAdmin } from "@/hooks/useAdmin";

export default function NotFound() {
  const { isAdmin, loading } = useAdmin();
  const location = window.location.pathname;

  // If admin tries to access non-admin page directly, redirect to admin dashboard  if (isAdmin && !loading && !location.pathname.startsWith("/admin")) {
    window.location.href = "/admin";
    return null;
  }

  // ... existing NotFound component code
</dyad-file>

<dyad-chat-summary>Fixed admin routing to prevent fallback to customer account</dyad-chat-summary><dyad-write path="src/pages/LoginPage.tsx" description="Store admin flag and redirect directly to admin dashboard">
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
}
]]>