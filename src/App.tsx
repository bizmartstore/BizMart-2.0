import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import PWARegister from "./components/PWARegister"; // Add this import

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <PWAInstallGate>
            {!splashDone && <SplashScreen onFinished={handleSplashFinished} />}
            <OneSignalInit />
            <PWARegister /> {/* Add this line */}
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AdminAutoRedirect />
              <Routes>
                {/* ... all your routes ... */}
              </Routes>
            </BrowserRouter>
          </PWAInstallGate>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);