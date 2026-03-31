import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import PWAInstallGate from "@/components/PWAInstallGate";
import PWARegister from "@/components/PWARegister";
import AdminAutoRedirect from "@/components/AdminAutoRedirect";

// Pages
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import CategoriesPage from "@/pages/CategoriesPage";
import MarketplacePage from "@/pages/MarketplacePage";
import ProductDetail from "@/pages/ProductDetail";
import CartPage from "@/pages/CartPage";
import OrdersPage from "@/pages/OrdersPage";
import ProfilePage from "@/pages/ProfilePage";
import BCoinsPage from "@/pages/BCoinsPage";
import GCashPage from "@/pages/GCashPage";
import ClubPage from "@/pages/ClubPage";
import MessagesPage from "@/pages/MessagesPage";
import SellersPage from "@/pages/SellersPage";
import StoreViewPage from "@/pages/StoreViewPage";
import SellerStorePage from "@/pages/SellerStorePage";
import JobsPage from "@/pages/JobsPage";
import JobPostPage from "@/pages/JobPostPage";
import JobDetailPage from "@/pages/JobDetailPage";
import FreelancerApplyPage from "@/pages/FreelancerApplyPage";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

// Components
import SplashScreen from "@/components/SplashScreen";
import { useOneSignal } from "@/hooks/useOneSignal";

const queryClient = new QueryClient();

function AppContent() {
  const { user } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  // Initialize OneSignal with current user
  useOneSignal(user);

  const handleSplashFinished = () => {
    setSplashDone(true);
  };

  return (
    <>
      {!splashDone && <SplashScreen onFinished={handleSplashFinished} />}
      <PWARegister />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AdminAutoRedirect />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bcoins" element={<BCoinsPage />} />
          <Route path="/gcash" element={<GCashPage />} />
          <Route path="/club" element={<ClubPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/sellers" element={<SellersPage />} />
          <Route path="/store/:sellerId" element={<StoreViewPage />} />
          <Route path="/seller-store" element={<SellerStorePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/post" element={<JobPostPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/jobs/apply" element={<FreelancerApplyPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <PWAInstallGate>
              <AppContent />
            </PWAInstallGate>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;