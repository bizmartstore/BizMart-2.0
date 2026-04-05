import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { ArrowLeft, MapPin, Star, Package, MessageSquare, Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import bizMartLogo from "@/assets/bizmart-install-logo.png";

interface SellerStore {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string;
  store_image: string;
  store_saying: string;
  location: string;
}

export default function StoreViewPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const isOfficial = sellerId === "bizmart-official";

  const [store, setStore] = useState<SellerStore | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const loadStore = async () => {
      if (isOfficial) {
        // Load all active products for the BizMart official store
        const { data: prods } = await (supabase as any)
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("sold", { ascending: false });
        setProducts(prods || []);
        setLoading(false);
      } else {
        // Load seller profile
        const { data: sellerData } = await (supabase as any)
          .from("seller_profiles")
          .select("*")
          .eq("id", sellerId)
          .maybeSingle();
        setStore(sellerData);

        // Load seller's products (products with seller_id matching)
        const { data: sellerProds } = await (supabase as any)
          .from("products")
          .select("*")
          .eq("seller_id", sellerId)
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        setProducts(sellerProds || []);
        setLoading(false);
      }
    };
    loadStore();
  }, [sellerId, isOfficial]);

  const categories = isOfficial
    ? ["all", ...new Set(products.map((p: any) => p.category).filter(Boolean))]
    : ["all", ...new Set(products.map((p: any) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p: any) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const mappedProducts = filteredProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price,
    image: p.images && Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || "/placeholder.svg"),
    category: p.category || "",
    rating: p.rating || 4.5,
    sold: p.sold || 0,
    isFlashSale: p.is_flash_sale || false,
    description: p.description || "",
    stock: p.stock ?? 0,
    images: p.images || (p.image ? [p.image] : []),
  }));

  const storeName = isOfficial ? "BizMart Official Store" : store?.store_name || "Store";
  const storeSaying = isOfficial ? "Your one-stop campus shop! 🏪" : store?.store_saying || "";
  const storeDesc = isOfficial
    ? "Official BizMart store with all campus products. Managed by the BizMart admin team."
    : store?.store_description || "";
  const storeLocation = isOfficial ? "Campus Main" : store?.location || "";
  const storeImage = isOfficial ? "" : store?.store_image || "";

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      {/* Store Hero Banner */}
      <div className="relative">
        <div
          className="h-44 w-full relative overflow-hidden"
          style={{
            background: isOfficial
              ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7), #fdba74)"
              : storeImage
                ? undefined
                : "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary) / 0.5))",
          }}
        >
          {storeImage && !isOfficial && (
            <img src={storeImage} alt={storeName} className="w-full h-full object-cover" />
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Back button */}
          <button
            onClick={() => navigate("/sellers")}
            className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full z-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Store badge */}
          {isOfficial && (
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full z-10">
              <span className="text-white text-[10px] font-bold">✅ OFFICIAL STORE</span>
            </div>
          )}
        </div>

        {/* Store avatar floating over banner */}
        <div className="absolute -bottom-8 left-4 z-10">
          <div className="h-16 w-16 rounded-2xl bg-card border-[3px] border-background shadow-lg overflow-hidden flex items-center justify-center">
            {isOfficial ? (
              <img src={bizMartLogo} alt="BizMart" className="h-14 w-14 object-contain" />
            ) : storeImage ? (
              <img src={storeImage} alt={storeName} className="h-full w-full object-cover" />
            ) : (
              <Store className="h-7 w-7 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="font-extrabold text-lg text-foreground leading-tight">{storeName}</h1>
            {storeSaying && (
              <p className="text-xs text-primary italic mt-0.5">"{storeSaying}"</p>
            )}
          </div>
          {!isOfficial && (
            <button
              onClick={() => navigate(`/messages`)}
              className="bg-primary/10 text-primary p-2 rounded-xl ml-2 flex-shrink-0"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3">
          {storeLocation && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{storeLocation}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{mappedProducts.length} Products</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[11px] text-muted-foreground font-medium">4.8</span>
          </div>
        </div>

        {storeDesc && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{storeDesc}</p>
        )}
      </div>

      {/* Divider */}
      <div className="h-2 bg-muted/50" />

      {/* Search & Filter */}
      <div className="px-4 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
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
            ))}
          </div>
        )}
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
        )}
      </div>

      <BottomNav />
    </div>
  );
}