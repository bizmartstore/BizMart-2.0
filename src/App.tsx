import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import SplashScreen from "@/components/SplashScreen";
import OneSignalInit from "@/components/OneSignalInit";
import PWARegister from "@/components/PWARegister";
import AdminAutoRedirect from "@/components/AdminAutoRedirect";
import Index from "@/pages/Index";
import HomePage from "@/pages/HomePage";
import CategoriesPage from "@/pages/CategoriesPage";
import MarketplacePage from "@/pages/MarketplacePage";
import ProductDetail from "@/pages/ProductDetail";
import CartPage from "@/pages/CartPage";
import OrdersPage from "@/pages/OrdersPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import SearchPage from "@/pages/SearchPage";
import SellersPage from "@/pages/SellersPage";
import StoreViewPage from "@/pages/StoreViewPage";
import SellerStorePage from "@/pages/SellerStorePage";
import ClubPage from "@/pages/ClubPage";
import BCoinsPage from "@/pages/BCoinsPage";
import GCashPage from "@/pages/GCashPage";
import MessagesPage from "@/pages/MessagesPage";
import JobsPage from "@/pages/JobsPage";
import JobPostPage from "@/pages/JobPostPage";
import JobDetailPage from "@/pages/JobDetailPage";
import FreelancerApplyPage from "@/pages/FreelancerApplyPage";
import PrintServicePage from "@/pages/PrintServicePage";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AdminAutoRedirect />
            <OneSignalInit />
            <PWARegister />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/sellers" element={<SellersPage />} />
              <Route path="/store/:sellerId" element={<StoreViewPage />} />
              <Route path="/seller-store" element={<SellerStorePage />} />
              <Route path="/club" element={<ClubPage />} />
              <Route path="/bcoins" element={<BCoinsPage />} />
              <Route path="/gcash" element={<GCashPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/post" element={<JobPostPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/jobs/apply" element={<FreelancerApplyPage />} />
              <Route path="/print-service" element={<PrintServicePage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;