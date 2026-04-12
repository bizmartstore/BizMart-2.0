import { useState, useEffect, useMemo } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Store, MessageCircle, Search, X, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
  
type SortOption =
  | "default"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za"
  | "best-selling";

export default function MarketplacePage() {
  const { data: products = [], refetch: refetchProducts } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sellerProfiles, setSellerProfiles] = useState<Record<string, any>>(
    {}
  );
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    (supabase as any)
      .from("seller_profiles")
      .select("*")
      .eq("is_active", true)
      .then(({ data }: any) => {
        const map: Record<string, any> = {};
        (data || []).forEach((s: any) => {
          map[s.user_id] = s;
        });
        setSellerProfiles(map);
      });
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("marketplace-products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          refetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchProducts]);

  const startChat = async (sellerId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: existing } = await (supabase as any)
      .from("conversations")
      .select("*")
      .or(
        `and(participant_1.eq.${user.id},participant_2.eq.${sellerId}),and(participant_1.eq.${sellerId},participant_2.eq.${user.id})`
      )
      .maybeSingle();

    if (!existing) {
      await (supabase as any).from("conversations").insert({
        participant_1: user.id,
        participant_2: sellerId,
      });
    }

    navigate("/messages");
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [products]);

  // ================================
  // FILTER + SORT
  // ================================
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === "all" || p.category === selectedCategory;

      return matchSearch && matchCategory;
    });

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name-az":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-za":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "best-selling":
        filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
        break;
    }

    return filtered;
  }, [products, search, selectedCategory, sortBy]);

  // ================================
  // 🔥 FLASH SALE (IMPORTANT FIX)
  // ================================
  const flashSaleProducts = useMemo(() => {
    return filteredProducts.filter((p) => p.is_flash_sale === true);
  }, [filteredProducts]);

  // ================================
  // NORMAL PRODUCTS (NO FLASH SALE)
  // ================================
  const normalProducts = useMemo(() => {
    return filteredProducts.filter((p) => !p.is_flash_sale);
  }, [filteredProducts]);

  const adminProducts = normalProducts.filter((p) => !(p as any).seller_id);

  const sellerProductsMap: Record<string, typeof normalProducts> = {};
  normalProducts.forEach((p) => {
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
        <p className="text-xs text-muted-foreground mb-3">
          Browse all products from verified sellers
        </p>

        {/* SEARCH */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9 pr-9 text-sm h-9 rounded-xl"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* CATEGORY + SORT */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {cat === "all"
                  ? "All"
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSort(!showSort)}
            className={`p-2 rounded-xl ${
              showSort
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>

        {/* FLASH SALE SECTION (FIXED) */}
        {flashSaleProducts.length > 0 && (
          <div className="mb-5">
            <h2 className="font-bold text-sm mb-2 text-red-500">
              🔥 Flash Sale
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {flashSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* ADMIN PRODUCTS */}
        {adminProducts.length > 0 && (
          <div className="mb-5">
            <span className="font-bold text-sm">BizMart Official</span>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {adminProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* SELLER PRODUCTS */}
        {Object.entries(sellerProductsMap).map(([sellerId, prods]) => {
          const seller = sellerProfiles[sellerId];

          return (
            <div key={sellerId} className="mb-5">
              <div className="flex justify-between mb-2">
                <div
                  onClick={() => navigate(`/store/${sellerId}`)}
                  className="flex gap-2"
                >
                  <Store className="h-4 w-4" />
                  <span className="text-sm font-bold">
                    {seller?.store_name || "Store"}
                  </span>
                </div>

                <button
                  onClick={() => startChat(sellerId)}
                  className="text-xs text-primary"
                >
                  Chat
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

        {/* EMPTY STATE */}
        {filteredProducts.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            No products found
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  );
}