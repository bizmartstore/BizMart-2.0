import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Index from "@/pages/Index";
import CategoriesPage from "@/pages/CategoriesPage";
import MarketplacePage from "@/pages/MarketplacePage";
import CartPage from "@/pages/CartPage";
import OrdersPage from "@/pages/OrdersPage";
import ProductDetail from "@/pages/ProductDetail";
import BCoinsPage from "@/pages/BCoinsPage";
import GCashPage from "@/pages/GCashPage";
import ClubPage from "@/pages/ClubPage";
import MessagesPage from "@/pages/MessagesPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import AdminAutoRedirect from "@/components/AdminAutoRedirect";
import PWARegister from "@/components/PWARegister";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import LiveShoutoutTicker from "@/components/LiveShoutoutTicker";
import NewsCarousel from "@/components/NewsCarousel";
import BizMartFeatures from "@/components/BizMartFeatures";
import BannerCarousel from "@/components/BannerCarousel";
import PrintServicePage from "@/pages/PrintServicePage";
import SellerStorePage from "@/pages/SellerStorePage";
import SellersPage from "@/pages/SellersPage";
import { Loader2 } from "lucide-react";

function App() {
  const { user, isAuthReady } = useAuth();

  useEffect(() => {
    // Optional: logic after auth
  }, [user]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Router>
      <AdminAutoRedirect />
      <AnnouncementPopup />
      <LiveShoutoutTicker />
      <NewsCarousel />
      <BizMartFeatures />
      <BannerCarousel />
      <TopBar />
      <main className="min-h-screen bg-background pb-20">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories?selected=:selected" element={<CategoriesPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/bcoins" element={<BCoinsPage />} />
          <Route path="/gcash" element={<GCashPage />} />
          <Route path="/club" element={<ClubPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/print-service" element={<PrintServicePage />} />
          <Route path="/seller-store" element={<SellerStorePage />} />
          <Route path="/sellers" element={<SellersPage />} />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
      <PWARegister />
      <PWAUpdatePrompt />
    </Router>
  );
}

export default App;