"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import PWARegister from "@/components/PWARegister";
import AdminAutoRedirect from "@/components/AdminAutoRedirect";
import SplashScreen from "@/components/SplashScreen";
import { Loader2 } from "lucide-react";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

function AppContent() {
  const { loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Safety timeout for splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PWARegister />
      <Toaster />
      <Sonner />
      <TooltipProvider>
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
      </TooltipProvider>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;