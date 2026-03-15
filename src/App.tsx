// ... existing imports
import NotificationPromptBanner from "@/components/NotificationPromptBanner";
// ... rest of imports

const App = () => {
  // ... existing code

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <PWAInstallGate>
              {!splashDone && <SplashScreen onFinished={handleSplashFinished} />}
              <OneSignalInit />
              <NotificationPromptBanner /> {/* Add this */}
              <Toaster />
              <Sonner />
              {/* ... rest of your routes */}
            </PWAInstallGate>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;