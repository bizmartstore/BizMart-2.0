import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { Store, MapPin, ArrowLeft, Star, Package, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import bizMartLogo from "@/assets/bizmart-install-logo.png";

export default function SellersPage() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (supabase as any)
      .from("seller_profiles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        setSellers(data || []);
        setLoading(false);
      });
  }, []);

  const filteredSellers = sellers.filter(
    (s) =>
      !search ||
      (s.store_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.location || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate("/")} className="p-1">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-extrabold text-lg leading-tight">Campus Stores</h1>
            <p className="text-[10px] text-muted-foreground">Browse verified seller stores</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores..."
            className="pl-9 text-sm h-9 rounded-xl"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-3">
            {/* ═══ BizMart Official Store ═══ */}
            <div
              className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg active:scale-[0.98] transition-transform cursor-pointer bg-card"
              onClick={() => navigate("/store/bizmart-official")}
            >
              {/* Banner */}
              <div className="h-24 relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7), #fdba74)" }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full">
                  ✅ OFFICIAL
                </span>
              </div>

              {/* Store info */}
              <div className="p-3 relative">
                {/* Floating avatar */}
                <div className="absolute -top-7 left-3">
                  <div className="h-12 w-12 rounded-xl bg-card border-2 border-background shadow-md overflow-hidden flex items-center justify-center">
                    <img src={bizMartLogo} alt="BizMart" className="h-10 w-10 object-contain" />
                  </div>
                </div>

                <div className="ml-16 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-sm">BizMart Official Store</h3>
                    <p className="text-[10px] text-primary italic">"Your one-stop campus shop! 🏪"</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>

                <div className="flex items-center gap-3 mt-2 ml-16">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Campus Main</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] text-muted-foreground">4.9</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">All Products</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Seller Stores ═══ */}
            {filteredSellers.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl overflow-hidden border border-border shadow-sm active:scale-[0.98] transition-transform cursor-pointer bg-card"
                onClick={() => navigate(`/store/${s.id}`)}
              >
                {/* Banner */}
                <div className="h-20 relative overflow-hidden bg-gradient-to-br from-secondary/30 to-primary/10">
                  {s.store_image && (
                    <img src={s.store_image} alt={s.store_name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Store info */}
                <div className="p-3 relative">
                  <div className="absolute -top-6 left-3">
                    <div className="h-10 w-10 rounded-xl bg-card border-2 border-background shadow-md overflow-hidden flex items-center justify-center">
                      {s.store_image ? (
                        <img src={s.store_image} alt={s.store_name} className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>

                  <div className="ml-14 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{s.store_name || "Unnamed Store"}</h3>
                      {s.store_saying && (
                        <p className="text-[10px] text-primary italic truncate">"{s.store_saying}"</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 mt-2 ml-14">
                    {s.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{s.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] text-muted-foreground">4.5</span>
                    </div>
                  </div>

                  {s.store_description && (
                    <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{s.store_description}</p>
                  )}
                </div>
              </div>
            ))}

            {filteredSellers.length === 0 && !loading && sellers.length > 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">No stores match your search</p>
            )}
            {sellers.length === 0 && !loading && (
              <p className="text-center text-xs text-muted-foreground py-6">No seller stores yet — be the first!</p>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
