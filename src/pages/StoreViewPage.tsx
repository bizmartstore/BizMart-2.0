import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { ArrowLeft, MapPin, Star, Package, MessageSquare, Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function StoreViewPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const isOfficial = sellerId === "bizmart-official";

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const loadStore = async () => {
      if (isOfficial) {
        const { data: prods } = await (supabase as any)
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("sold", { ascending: false });
        setProducts(prods || []);
        setLoading(false);
      } else {
        const { data: sellerData } = await (supabase as any).from("seller_profiles").select("*").eq("id", sellerId).maybeSingle();
        setStore(sellerData);
        setProducts([]);               // For now, show empty – future: filter by seller_id
        setLoading(false);
      }
    };
    loadStore();
  }, [sellerId, isOfficial]);

  const categories = isOfficial
    ? ["all", ...new Set(products.map((p: any) => p.category).filter(Boolean))]
    : ["all"];

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
    image: p.image || "/placeholder.svg",
    category: p.category || "",
    rating: p.rating || 4.5,
    sold: p.sold || 0,
    isFlashSale: p.is_flash_sale || false,
    description: p.description || "",
  });

  const storeName = isOfficial ? "BizMart Official Store" : store?.store_name || "Store";
  const storeSaying = isOfficial ? "Your one‑stop campus shop! 🏪" : store?.store_saying || "";
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
            onClick={() => navigate(-1)}             className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white p-2 rounded-full z-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
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
            {!isOfficial && (
              <button
                onClick={() => navigate("/messages")}
                className="bg-primary/10 text-primary p-2 rounded-xl ml-2 flex-shrink-0"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3">
            {storeLocation && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{storeLocation}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[11px] text-muted-foreground font-medium">4.8</span>
            </div>
          </div>

          {/* Description */}
          {storeDesc && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{storeDesc}</p>
          </div>

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
                ))}
              </div>
            </div>

            {/* Products Grid */}
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
            </div>
          </div>

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
                </button>
              </div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}