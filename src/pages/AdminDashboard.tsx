import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useTranslation } from "@/hooks/useTranslation";
import { useAdmin } from "@/hooks/useAdmin";

export default function AdminDashboard() {
  const { role, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalPrintOrders: 0,
    pendingPrintOrders: 0,
    totalSellers: 0,
    totalClubMembers: 0,
    totalGCashTransactions: 0,
    pendingGCashTransactions: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Find the effect that redirects non-admin users
  // Replace the redirect logic to only redirect when NOT on admin routes
  // This prevents infinite redirect loop when already on /admin
  const adminPaths = ["/admin", "/login", "/signup"];
  if (adminPaths.some((p) => location.pathname.startsWith(p))) {
    // Do nothing - allow admin pages to load
  } else {
    // Only redirect non-admin users
    if (!roleLoading && role && !role.startsWith("admin")) {
      console.log("[AdminDashboard] Redirecting non-admin to /admin");
      navigate("/admin", { replace: true });
    }
  }

  // ... rest of component unchanged ...