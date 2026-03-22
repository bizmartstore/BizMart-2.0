import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { Store, MapPin, ArrowLeft, Star, Package, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    }, [];

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
          )}          {/* ═══ BizMart Official Store ═══ */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}          {/* ═══ BizMart Official Store ═══ */}
          <div className="rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg active:scale-[0.98] transition-transform cursor-pointer bg-card">
            {/* Banner */}
            <div className="h-24 relative overflow-hidden" style={{
              background: isOfficial
                ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7), #fdba74)"
                : storeImage
                  ? undefined
                  : "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary) / 0.5))",
            }
          >
            {storeImage && !isOfficial && (
              <img src={storeImage} alt={storeName} className="w-full h-full object-cover" />
            )}          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Store badge */}
          {isOfficial && (
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full z-10">
              <span className="text-white text-[10px] font-bold">✅ OFFICIAL STORE</span>
            </div>
          )}         </div>

          {/* Store Info */}
          <div className="px-4 pt-12 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="font-extrabold text-lg text-foreground leading-tight">{storeName}</h1>
                {storeSaying && <p className="text-xs text-primary italic mt-0.5">"{storeSaying}"</p>}
              </div>
              <div className="flex items-start gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{storeLocation}</span>
              </div>
              <div className="flex items-start gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-[11px] text-muted-foreground font-medium">4.9</span>
              </div>
            </div>

            <div className="flex items-start gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{storeLocation}</span>
            </div>
            <div className="flex items-start gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[11px] text-muted-foreground">4.9</span>
            </div>
            {storeDesc && (
              <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{storeDesc}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-2 bg-muted/50" />

          {/* Search & Filter */}
          <div className="px-4 py-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${storeName}...`}
                className="pl-9 text-sm h-9 rounded-xl"
              />
            </div>

            {/* Category pills */}
            {categories.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat as string}
                    onClick={() => setSelectedCategory(cat as string)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {(cat as string) === "all" ? "All" : (cat as string).charAt(0).toUpperCase() + (cat as string).slice(1)}
                  </button>
                ))}          </div>

              <div className="px-4 py-3 space-y-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search in ${storeName}...`}
                  className="pl-9 text-sm h-9 rounded-xl"
                />
              </div>

              {/* Products Grid */}
              <div className="px-3 pb-4">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : mappedProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-bold text-muted-foreground">No products yet</p>
                    <p className="text-xs text-muted-foreground mt-1">This store hasn't listed any products.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {mappedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}   </div>   <BottomNav />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}