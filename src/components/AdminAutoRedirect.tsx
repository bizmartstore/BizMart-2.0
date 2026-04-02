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
    
    // If user is admin and NOT on an admin page, redirect to admin
    if (user && isAdmin) {
      const isAdminPage = 
        location.pathname.startsWith('/admin') || 
        location.pathname === '/login' || 
        location.pathname === '/signup';
      
      if (!isAdminPage) {
        console.log('[AdminAutoRedirect] Admin on public page, redirecting to /admin');
        navigate('/admin', { replace: true });
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, location.pathname, navigate]);

  return null;
}