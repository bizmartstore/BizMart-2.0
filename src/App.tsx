<![CDATA[
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Sonner } from "@/components/ui/sonner";
import { VitePWA } from "vite-plugin-pwa";
import PWARegister from "@/components/PWARegister";
import AdminAutoRedirect from "@/components/AdminAutoRedirect";
import RequireAdmin from "@/components/RequireAdmin";

// ... other imports ...

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
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
            {/* Admin routes - ALL protected with RequireAdmin */}
            <Route path="/admin" element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            } />
            <Route path="/sellers" element={
              <RequireAdmin>
                <SellersPage />
              </RequireAdmin>
            } />
            <Route path="/settings" element={
              <RequireAdmin>
                <SettingsTab />
              </RequireAdmin>
            } />
            <Route path="/bcoins" element={
              <RequireAdmin>
                <BCoinsPage />
              </RequireAdmin>
            } />
            <Route path="/gcash" element={
              <RequireAdmin>
                <GCashPage />
              </RequireAdmin>
            } />
            <Route path="/jobs" element={
              <RequireAdmin>
                <JobsPage />
              </RequireAdmin>
            } />
            <Route path="/jobs/post" element={
              <RequireAdmin>
                <JobPostPage />
              </RequireAdmin>
            } />
            <Route path="/jobs/:id" element={
              <RequireAdmin>
                <JobDetailPage />
              </RequireAdmin>
            } />
            
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/club" element={<ClubPage />} />
            <Route path="/bcoins" element={<BCoinsPage />} />
            <Route path="/gcash" element={<GCashPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/post" element={<JobPostPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/print" element={<PrintServicePage />} />
            <Route path="/store/:sellerId" element={<StoreViewPage />} />
            <Route path="/seller-store" element={<SellerStorePage />} />
            <Route path="/freelancer/apply" element={<FreelancerApplyPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
]]>