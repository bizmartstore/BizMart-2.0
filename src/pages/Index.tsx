<![CDATA[
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import BizMartFeatures from "@/components/BizMartFeatures";
import NewsCarousel from "@/components/NewsCarousel";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import LiveShoutoutTicker from "@/components/LiveShoutoutTicker";
import { useProducts } from "@/hooks/useProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { storeOpen, closeMessage } = useAppSettings();

  // Redirect admin users away from homepage
  useEffect(() => {
    if (!adminLoading && isAdmin && user) {
      console.log('[Index] Admin detected, redirecting to /admin');
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, adminLoading, user, navigate]);

  // Show loading state while checking admin status
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If admin, render nothing (will redirect)
  if (isAdmin && user) {
    return null;
  }

  // Rest of the existing Index component code continues...
  // ... (keep all existing code for the customer homepage)
}
]]>