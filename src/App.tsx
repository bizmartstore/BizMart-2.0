<![CDATA[
import RequireAdmin from "@/components/RequireAdmin";

// ... existing imports and queryClient setup ...

function AppContent() {
  // ... existing splash screen logic ...

  return (
    <>
      <PWARegister />
      <Toaster />
      <Sonner />
      <TooltipProvider>
        <BrowserRouter>
          <AdminAutoRedirect />
          <Routes>
            {/* ADMIN ROUTES - WRAPPED WITH REQUIREADMIN */}
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/sellers" element={<RequireAdmin><SellersPage /></RequireAdmin>} />
            <Route path="/settings" element={<RequireAdmin><SettingsTab /></RequireAdmin>} />
            <Route path="/bcoins" element={<RequireAdmin><BCoinsPage /></RequireAdmin>} />
            <Route path="/gcash" element={<RequireAdmin><GCashPage /></RequireAdmin>} />
            <Route path="/jobs" element={<RequireAdmin><JobsPage /></RequireAdmin>} />
            <Route path="/jobs/post" element={<RequireAdmin><JobPostPage /></RequireAdmin>} />
            <Route path="/jobs/:id" element={<RequireAdmin><JobDetailPage /></RequireAdmin>} />
            {/* Other public routes remain unchanged */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            {/* ... rest of routes */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </>
  );
}
]]>