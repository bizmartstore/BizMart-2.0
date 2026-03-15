import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import PWAInstallGate from "@/components/PWAInstallGate";
import SplashScreen from "@/components/SplashScreen";
import OneSignalInit from "@/components/OneSignalInit";
import NotificationPromptBanner from "@/components/NotificationPromptBanner";
import AdminDashboard from "@/pages/AdminDashboard";
import BCoinsPage from "@/pages/BCoinsPage";
import CartPage from "@/pages/CartPage";
import CategoriesPage from "@/pages/CategoriesPage";
import ClubPage from "@/pages/ClubPage";
import GCashPage from "@/pages/GCashPage";
import HomePage from "@/pages/HomePage";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import MarketplacePage from "@/pages/MarketplacePage";
import MessagesPage from "@/pages/MessagesPage";
import NotFound from "@/pages/NotFound";
import OrdersPage from "@/pages/OrdersPage";
import PrintServicePage from "@/pages/PrintServicePage";
import ProductDetail from "@/pages/ProductDetail";
import ProfilePage from "@/pages/ProfilePage";
import SearchPage from "@/pages/SearchPage";
import SellerStorePage from "@/pages/SellerStorePage";
import SignUpPage from "@/pages/SignUpPage";
import SellersPage from "@/pages/SellersPage";
import StoreViewPage from "@/pages/StoreViewPage";
import AdminAutoRedirect from "@/components/AdminAutoRedirect";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinished = () => {
    setSplashDone(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <PWAInstallGate>
                {!splashDone && <SplashScreen onFinished={handleSplashFinished} />}
                <OneSignalInit />
                <NotificationPromptBanner />
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/store/:sellerId" element={<StoreViewPage />} />
                  <Route path="/sellers" element={<SellersPage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/bcoins" element={<BCoinsPage />} />
                  <Route path="/gcash" element={<GCashPage />} />
                  <Route path="/print-service" element={<PrintServicePage />} />
                  <Route path="/club" element={<ClubPage />} />
                  <Route path="/seller-store" element={<SellerStorePage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <AdminAutoRedirect />
              </PWAInstallGate>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;