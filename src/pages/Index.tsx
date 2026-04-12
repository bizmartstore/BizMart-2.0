"use client";

import TopBar from "@/components/TopBar";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";
import BizMartFeatures from "@/components/BizMartFeatures";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import LiveShoutoutTicker from "@/components/LiveShoutoutTicker";
import NewsCarousel from "@/components/NewsCarousel";
import { useProducts, useCategories, useFlashSaleProducts } from "@/hooks/useProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useNavigate } from "react-router-dom";
import { Zap, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import DealsOfTheDaySection from "@/components/DealsOfTheDaySection";
import FlashSaleSection from "@/components/FlashSaleSection";
import FeaturedProductsSection from "@/components/FeaturedProductsSection";
import TrendingNowSection from "@/components/TrendingNowSection";
import HottestSaleSection from "@/components/HottestSaleSection";

function FlashTimer({ endsAt, onExpired }: { endsAt?: string | null; onExpired: () => void }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      let targetTime: number;

      if (endsAt) {
        targetTime = new Date(endsAt).getTime();
      } else {
        // Fallback to 2-hour window calculation if no DB time provided
        const epoch = Math.floor(now / 1000);
        const windowSize = 7200; // 2 hours
        targetTime = (Math.floor(epoch / windowSize) + 1) * windowSize * 1000;
      }

      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setRemaining(diff);

      if (diff <= 0) {
        onExpired();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpired]);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1">
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="bg-white text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">{v}</span>
          {i < 2 && <span className="text-white font-bold text-xs">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: flashSaleProducts = [], isLoading: flashLoading } = useFlashSaleProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { storeOpen, closeMessage, allSettings, loading: settingsLoading, refetch: refetchSettings } = useAppSettings();
  const [forceShow, setForceShow] = useState(false);

  // Extract flash sale end time from settings
  const flashSaleState = useMemo(() =>
    allSettings?.find((s: any) => s.key === 'flash_sale_state')?.value,
  [allSettings]);

  useEffect(() => {
    const timer = setTimeout(() => setForceShow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const recommendedProducts = useMemo(() => {
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  }, [products]);

  const refreshAllData = useCallback(() => {
    console.log("[Index] Refreshing all data...");
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["flash-sale-products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    refetchSettings();
  }, [queryClient, refetchSettings]);

  useEffect(() => {
    // Listen for product changes AND settings changes (rotation happens in settings)
    const channel = supabase
      .channel("index-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        refreshAllData();
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "app_settings",
        filter: "key=eq.flash_sale_state"
      }, () => {
        console.log("[Index] Flash sale rotation detected via settings update");
        refreshAllData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshAllData]);

  const handleFlashExpired = useCallback(() => {
    // Small delay to allow the server-side rotation to complete
    setTimeout(refreshAllData, 2000);
  }, [refreshAllData]);

  const isActuallyLoading = (productsLoading || categoriesLoading || flashLoading) && !forceShow && products.length === 0;

  if (isActuallyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading BizMart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <AnnouncementPopup />
      <LiveShoutoutTicker />

      {!storeOpen && !settingsLoading && (
        <div className="mx-3 mt-2 bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive font-semibold">{closeMessage || 'Store is currently closed.'}</p>
        </div>
      )}

      <BannerCarousel />
      <BizMartFeatures />
      <NewsCarousel />

      <div className="mt-5 px-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📂</span>
          <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">Categories</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/categories?selected=${cat.id}`)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-[0.95] transition-all group"
            >
              <div className="bg-gradient-to-br from-sky-500 to-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white">{cat.icon}</span>
              </div>
              <span className="text-[10px] text-foreground font-bold whitespace-nowrap leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* HOTTEST SALE SECTION - NEW! - Positioned at the very top */}
      <HottestSaleSection />

      {/* DEALS OF THE DAY SECTION */}
      <DealsOfTheDaySection />

      {/* PRIMARY FLASH SALE SECTION */}
      {flashSaleProducts.length > 0 && (
        <div className="mt-5 px-3">
          <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-2xl p-3.5 mb-3 shadow-lg relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/10 rounded-full" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-xl p-1.5"><Zap className="h-5 w-5 text-white fill-white" /></div>
                <div>
                  <span className="font-extrabold text-white text-sm uppercase tracking-wide block">Flash Sale</span>
                  <span className="text-white/70 text-[10px] font-medium">Limited time only!</span>
                </div>
              </div>
              <FlashTimer endsAt={flashSaleState?.ends_at} onExpired={handleFlashExpired} />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {flashSaleProducts.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-36">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}

      <FeaturedProductsSection />

      <TrendingNowSection />

      <div className="mt-6 px-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💎</span>
          <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">Recommended For You</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {recommendedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}