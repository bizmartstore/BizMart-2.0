import { useState, useEffect, useMemo } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Store, MessageCircle, Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";

type SortOption = "default" | "price-low" | "price-high" | "name-az" | "name-za" | "best-selling";

export default function MarketplacePage() {
  const { data: products = [], refetch: refetchProducts } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sellerProfiles, setSellerProfiles] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    (supabase as any).from("seller_profiles").select("*").eq("is_active", true)
      .then(({ data }: any) => {
        const map: Record<string, any> = {};
        (data || []).forEach((s: any) => { map[s.user_id] = s; });
        setSellerProfiles(map);
      });
  }, []);

  // Realtime subscription for product changes
  useEffect(() => {
    const channel = supabase
      .channel("marketplace-products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        refetchProducts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchProducts]);

  const startChat = async (sellerId: string) => {
    if (!user) { navigate("/login"); return; }
    const { data: existing } = await (supabase as any)
      .from("conversations")
      .select("*")
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${sellerId}),and(participant_1.eq.${sellerId},participant_2.eq.${user.id})`)
      .maybeSingle();

    if (!existing) {
      await (supabase as any).from("conversations").insert({
        participant_1: user.id, participant_2: sellerId,
      });
    }
    navigate("/messages");
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [products]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const matchSearch = !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });

    switch (sortBy) {
      case "price-low": filtered.sort((a, b) => a.price - b.price); break;
      case "price-high": filtered.sort((a, b) => b.price - a.price); break;
      case "name-az": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-za": filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "best-selling": filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0)); break;
    }
    return filtered;
  }, [products, search, selectedCategory, sortBy]);

  // Group filtered products by seller
  const adminProducts = filteredProducts.filter(p => !(p as any).seller_id);
  const sellerProductsMap: Record<string, typeof filteredProducts> = {};
  filteredProducts.forEach(p => {
    const sid = (p as any).seller_id;
    if (sid) {
      if (!sellerProductsMap[sid]) sellerProductsMap[sid] = [];
      sellerProductsMap[sid].push(p);
    }
  });

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "default", label: "Default" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A-Z" },
    { value: "name-za", label: "Name: Z-A" },
    { value: "best-selling", label: "Best Selling" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <h1 className="font-extrabold text-lg mb-1">Marketplace</h1>
        <p className="text-xs text-muted-foreground mb-3">Browse all products from verified sellers</p>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9 pr-9 text-sm h-9 rounded-xl"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category pills + Sort button */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSort(!showSort)}
            className={`flex-shrink-0 p-2 rounded-xl transition-all ${showSort ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* Sort dropdown */}
        {showSort && (
          <div className="mb-3 bg-card border border-border rounded-xl p-2 shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 px-1">Sort by</p>
            <div className="flex flex-wrap gap-1.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    sortBy === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        {(search || selectedCategory !== "all" || sortBy !== "default") && (
          <p className="text-[10px] text-muted-foreground mb-2">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            {search && <> for "<span className="font-bold">{search}</span>"</>}
          </p>
        )}

        {/* Admin/BizMart products */}
        {adminProducts.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Store className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm text-foreground">BizMart Official</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {adminProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Seller products */}
        {Object.entries(sellerProductsMap).map(([sellerId, prods]) => {
          const seller = sellerProfiles[sellerId];
          return (
            <div key={sellerId} className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2" onClick={() => navigate(`/store/${sellerId}`)} role="button">
                  <div className="w-7 h-7 rounded-lg bg-accent overflow-hidden flex items-center justify-center">
                    {seller?.store_image ? <img src={seller.store_image} className="w-full h-full object-cover" alt="" /> :
                      <Store className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-foreground">{seller?.store_name || "Seller Store"}</span>
                    {seller?.location && <p className="text-[9px] text-muted-foreground">{seller.location}</p>}
                  </div>
                </div>
                <button
                  onClick={() => startChat(sellerId)}
                  className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full"
                >
                  <MessageCircle className="h-3 w-3" /> Chat
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {prods.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            {search || selectedCategory !== "all" ? "No products match your filters" : "No products available yet"}
          </p>
        )}
      </div>
      <BottomNav />
    </div>
  );
}