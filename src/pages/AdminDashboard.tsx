// Find the effect that redirects non-admin users
  // Replace the redirect logic to only redirect when NOT on admin routes
  // This prevents infinite redirect loop when already on /admin
  const adminPaths = ["/admin", "/login", "/signup"];
  if (adminPaths.some((p) => location.pathname.startsWith(p))) {
    return;
  }
  // Existing redirect logic remains for other pages
  console.log('[AdminDashboard] Redirecting admin to /admin');
  navigate("/admin", { replace: true });