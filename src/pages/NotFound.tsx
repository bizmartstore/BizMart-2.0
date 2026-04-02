<![CDATA[
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

export default function NotFound() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();

  useEffect(() => {
    if (!loading && isAdmin) {
      // If admin tries to access a non-existent page, send them to admin dashboard
      console.log('[NotFound] Admin on 404, redirecting to /admin');
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If admin, don't show 404 - they'll be redirected
  if (isAdmin) {
    return null;
  }

  // Regular 404 page for non-admin users
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Oops! Page not found</p>
      <a 
        href="/" 
        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
      >
        Return to Home
      </a>
    </div>
  );
}
]]>