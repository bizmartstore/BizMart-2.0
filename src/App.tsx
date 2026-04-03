import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import AdminDashboard from "@/pages/AdminDashboard";
import CategoriesPage from "@/pages/CategoriesPage";
import ProductDetail from "@/pages/ProductDetail";
import SearchPage from "@/pages/SearchPage";
import CartPage from "@/pages/CartPage";
import OrdersPage from "@/pages/OrdersPage";
import ProfilePage from "@/pages/ProfilePage";
import MessagesPage from "@/pages/MessagesPage";
import BCoinsPage from "@/pages/BCoinsPage";
import GCashPage from "@/pages/GCashPage";
import PrintServicePage from "@/pages/PrintServicePage";
import ClubPage from "@/pages/ClubPage";
import SellersPage from "@/pages/SellersPage";
import StoreViewPage from "@/pages/StoreViewPage";
import SellerStorePage from "@/pages/SellerStorePage";
import MarketplacePage from "@/pages/MarketplacePage";
import JobsPage from "@/pages/JobsPage";
import JobPostPage from "@/pages/JobPostPage";
import JobDetailPage from "@/pages/JobDetailPage";
import FreelancerApplyPage from "@/pages/FreelancerApplyPage";
import NotFound from "@/pages/NotFound";
import AdminAutoRedirect from "@/components/AdminAutoRedirect";
import PWARegister from "@/components/PWARegister";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import PWAInstallGate from "@/components/PWAInstallGate";
import SplashScreen from "@/components/SplashScreen";
import { useState } from "react";

const queryClient = new QueryClient();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <PWARegister />
            <PWAUpdatePrompt />
            <AdminAutoRedirect />
            {showSplash ? (
              <SplashScreen onFinished={() => setShowSplash(false)} />
            ) : (
              <PWAInstallGate>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/bcoins" element={<BCoinsPage />} />
                  <Route path="/gcash" element={<GCashPage />} />
                  <Route path="/print-service" element={<PrintServicePage />} />
                  <Route path="/club" element={<ClubPage />} />
                  <Route path="/sellers" element={<SellersPage />} />
                  <Route path="/store/:sellerId" element={<StoreViewPage />} />
                  <Route path="/seller-store" element={<SellerStorePage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/jobs/post" element={<JobPostPage />} />
                  <Route path="/jobs/:id" element={<JobDetailPage />} />
                  <Route path="/freelancer-apply" element={<FreelancerApplyPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PWAInstallGate>
            )}
            <Toaster />
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}