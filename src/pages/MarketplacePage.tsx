"use client";

import { useState, useEffect, useMemo } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Store,
  MessageCircle,
  Search,
  X,
  ArrowUpDown,
  Zap,
  TrendingUp,
  Sparkles,
  Tag,
  PackagePlus,
  Filter,
  Tag as TagIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import FlashSaleSection from "@/components/FlashSaleSection";
import FeaturedProductsSection from "@/components/FeaturedProductsSection";
import TrendingNowSection from "@/components/TrendingNowSection";
import DealsOfTheDaySection from "@/components/DealsOfTheDaySection";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import CategoryHighlightSection from "@/components/CategoryHighlightSection";
import AnimatedProductCard from "@/components/AnimatedProductCard";
import ScrollingText from "@/components/ScrollingText";
import PriceRangeFilter from "@/components/PriceRangeFilter";

type SortOption =
  | "default"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za"
  | "best-selling";

export default function MarketplacePage() {
  const { data: products = [], refetch: refetchProducts } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { storeOpen } = useAppSettings();

  const [sellerProfiles, setSellerProfiles] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // Calculate min and max prices
  const priceBounds = useMemo(() => {
    const prices = products.map(p => p.price);
    return [
      Math.min(...prices, 0),
      Math.max(...prices, 10000)
    ];
  }, [products]);

  useEffect(() => {
    setPriceRange([priceBounds[0], priceBounds[1]]);
  }, [priceBounds]);

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

  const categoriesList = useMemo(() => {
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

      const matchPrice =
        p.price >= priceRange[0] && p.price <= priceRange[1];

      return matchSearch && matchCategory && matchPrice;
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
  }, [products, search, selectedCategory, sortBy, priceRange]);

  // ================================
  // 🔥 FLASH SALE & DISCOUNTED PRODUCTS (IMPORTANT FIX)
  // ================================
  const flashSaleProducts = useMemo(() => {
    return filteredProducts.filter((p) => p.isFlashSale === true);
  }, [filteredProducts]);

  // ================================
  // NORMAL PRODUCTS (NO FLASH SALE)
  // ================================
  const normalProducts = useMemo(() => {
    return filteredProducts.filter((p) => !p.isFlashSale);
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

  // ================================
  // DISCOUNTED PRODUCTS (for homepage-style display)
  // ================================
  const discountedProducts = useMemo(() => {
    return filteredProducts.filter((p) => {
      const basePrice = p.originalPrice ? Number(p.originalPrice) : Number(p.price);
      const salePrice = p.sale_price ? Number(p.sale_price) : basePrice;
      return salePrice < basePrice; // Has actual discount
    });
  }, [filteredProducts]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "default", label: "Default" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A-Z" },
    { value: "name-za", label: "Name: Z-A" },
    { value: "best-selling", label: "Best Selling" },
  ];

  return (
    <>
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

        {/* CATEGORY + SORT + FILTER */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categoriesList.map((cat) => (
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

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl ${
              showFilters
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* SORT DROPDOWN */}
        {showSort && (
          <div className="bg-card rounded-xl border border-border p-3 mb-4 shadow-lg animate-in slide-in-from-top-2">
            <div className="space-y-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortBy(opt.value);
                    setShowSort(false);
                  }}
                  className={`w-full text-left text-xs font-bold py-2 px-3 rounded-lg transition-all ${
                    sortBy === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FILTERS DROPDOWN */}
        {showFilters && (
          <div className="bg-card rounded-xl border border-border p-4 mb-4 shadow-lg animate-in slide-in-from-top-2">
            <PriceRangeFilter
              minPrice={priceBounds[0]}
              maxPrice={priceBounds[1]}
              onRangeChange={(min, max) => setPriceRange([min, max])}
              currentMin={priceRange[0]}
              currentMax={priceRange[1]}
            />
          </div>
        )}

        {/* ADMIN PRODUCTS - ONLY DISPLAY BIZMART OFFICIAL PRODUCTS */}
        {adminProducts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Store className="h-5 w-5 text-primary" />
              <span className="font-extrabold text-sm uppercase tracking-wide text-primary">
                BizMart Official
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {adminProducts.map((product) => (
                <AnimatedProductCard key={product.id} product={product} index={0} />
              ))}
            </div>
          </div>
        )}

        {/* DISCOUNTED PRODUCTS - Display like homepage */}
        {discountedProducts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-orange-500" />
              <span className="font-extrabold text-sm uppercase tracking-wide text-orange-500">
                Discounted Products
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {discountedProducts.map((product) => (
                <AnimatedProductCard key={product.id} product={product} index={0} />
              ))}
            </div>
          </div>
        )}

        {/* SELLER PRODUCTS */}
        {Object.entries(sellerProductsMap).map(([sellerId, prods]) => {
          const seller = sellerProfiles[sellerId];

          return (
            <div key={sellerId} className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div
                  onClick={() => navigate(`/store/${sellerId}`)}
                  className="flex gap-2 items-center cursor-pointer"
                >
                  <Store className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">
                    {seller?.store_name || "Store"}
                  </span>
                </div>

                <button
                  onClick={() => startChat(sellerId)}
                  className="text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  Chat Seller
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {prods.map((product, index) => (
                  <AnimatedProductCard
                    key={product.id}
                    product={product}
                    index={index}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* EMPTY STATE */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border mt-8">
            <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-bold text-muted-foreground">No products found</p>
            <p className="text-xs text-muted-foreground mt-2">
              Try adjusting your search or filter
            </p>
          </div>
        )}
      </div>

      {/* DISCOUNTED PRODUCTS - Display at the top */}
      {discountedProducts.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-orange-500" />
            <span className="font-extrabold text-sm uppercase tracking-wide text-orange-500">
              Discounted Products
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {discountedProducts.map((product) => (
              <AnimatedProductCard key={product.id} product={product} index={0} />
            ))}
          </div>
        </div>
      )}

      {/* ADMIN PRODUCTS - ONLY DISPLAY BIZMART OFFICIAL PRODUCTS */}
      {adminProducts.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-extrabold text-sm uppercase tracking-wide text-primary">
              BizMart Official
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {adminProducts.map((product) => (
              <AnimatedProductCard key={product.id} product={product} index={0} />
            ))}
          </div>
        </div>
      )}
    </div>

    <BottomNav />
  );
}