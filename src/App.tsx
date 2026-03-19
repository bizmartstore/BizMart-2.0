import { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { TooltipProvider } from './components/ui/tooltip';
import { PWAInstallGate } from './components/PWARegister';
import { SplashScreen } from './components/SplashScreen';
import { OneSignalInit } from './components/OneSignalInit';
import { PWARegister } from './components/PWARegister';
import { Toaster } from 'sonner';
import { Sonner } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminAutoRedirect } from './components/AdminAutoRedirect';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import MessagesPage from './pages/MessagesPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import BCoinsPage from './pages/BCoinsPage';
import GCashPage from './pages/GCashPage';
import PrintServicePage from './pages/PrintServicePage';
import ClubPage from './pages/ClubPage';
import NewsPage from './pages/NewsPage';
import JobsPage from './pages/JobsPage';
import SellersPage from './pages/SellersPage';
import StoreViewPage from './pages/StoreViewPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import NotFound from './pages/NotFound';

// Create a query client instance for React Query
const queryClient = new QueryClient();

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinished = () => {
    setSplashDone(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <PWAInstallGate>
              {!splashDone && <SplashScreen onFinished={handleSplashFinished} />}
              <OneSignalInit />
              <PWARegister />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AdminAutoRedirect />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/bcoins" element={<BCoinsPage />} />
                  <Route path="/gcash" element={<GCashPage />} />
                  <Route path="/print-service" element={<PrintServicePage />} />
                  <Route path="/club" element={<ClubPage />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/sellers" element={<SellersPage />} />
                  <Route path="/store/:sellerId" element={<StoreViewPage />} />
                  <Route path="/admin" element={<AdminDashboard />}>
                    <Route index element={<OverviewTab />} />
                    <Route path="overview" element={<OverviewTab />} />
                    <Route path="pos" element={<POSTab />} />
                    <Route path="orders" element={<OrdersTab />} />
                    <Route path="print" element={<PrintOrdersTab />} />
                    <Route path="jobs" element={<AdminJobsTab />} />
                    <Route path="messages" element={<AdminMessagesTab />} />
                    <Route path="codes" element={<CodesTab />} />
                    <Route path="gcash" element={<GCashTab />} />
                    <Route path="club" element={<ClubTab />} />
                    <Route path="news" element={<NewsTab />} />
                    <Route path="products" element={<ProductsTab />} />
                  </Route>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </PWAInstallGate>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}