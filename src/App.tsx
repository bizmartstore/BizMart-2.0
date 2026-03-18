import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import PWAInstallGate from "@/components/PWAInstallGate";
import HomePage from "./pages/HomePage";import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import CategoriesPage from "./pages/CategoriesPage";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import MarketplacePage from "./pages/MarketplacePage";
import SellersPage from "./pages/SellersPage";import SellerStorePage from "./pages/SellerStorePage";
import StoreViewPage from "./pages/StoreViewPage";
import ClubPage from "./pages/ClubPage";
import GCashPage from "./pages/GCashPage";
import BCoinsPage from "./pages/BCoinsPage";
import AdminDashboard from "./pages/AdminDashboard";
import OrdersPage from "./pages/OrdersPage";
import PrintServicePage from "./pages/PrintServicePage";
import MessagesPage from "./pages/MessagesPage";import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const handleSplashFinished = useCallback(() => setSplashDone(true), []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>      <CartProvider>
        <TooltipProvider>
          {!splashDone && <SplashScreen onFinished={handleSplashFinished} />}
          {splashDone && <PWAInstallGate onPromptChange={setShowPwaPrompt} />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<CartPage />} />              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/search" element={<SearchPage />} />              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<LoginPage />} />              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/sellers" element={<SellersPage />} />              <Route path="/store/:sellerId" element={<StoreViewPage />} />
              <Route path="/seller-store" element={<SellerStorePage />} />
              <Route path="/club" element={<ClubPage />} />
              <Route path="/gcash" element={<GCashPage />} />              <Route path="/bcoins" element={<BCoinsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/print-service" element={<PrintServicePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;