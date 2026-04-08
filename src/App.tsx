import { Loader2 } from "lucide-react";
// ... existing imports ...

{loading ? (
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
) : (
  /* existing content */
)}

{/* Route definitions */}
<Route path="/print-service" element={<PrintServicePage />} />
<Route path="/seller-store" element={<SellerStorePage />} />
<Route path="/sellers" element={<SellersPage />} />