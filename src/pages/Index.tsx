import { useState } from "react"; // Fixed incorrect 'use client' import

import TopBar from "@/components/TopBar";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";
import BizMartFeatures from "@/components/BizMartFeatures";
import BizMartATMCard from "@/components/BizMartATMCard"; // Added missing import
import AnnouncementPopup from "@/components/AnnouncementPopup";
import LiveShoutoutTicker from "@/components/LiveShoutoutTicker";
import NewsCarousel from "@/components/NewsCarousel";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useNavigate } from "react-router-dom";
import { Zap, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

function FlashTimer({ endsAt, onExpired }: { endsAt: string; onExpired: () => void }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) onExpired();
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
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { storeOpen, closeMessage, allSettings, loading: settingsLoading } = useAppSettings();
  const [flashEndsAt, setFlashEndsAt] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForceShow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const flashSaleProducts = products.filter((p) => p.isFlashSale);

  const recommendedProducts = useMemo(() => {
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  }, [products]);

  const loadFlashState = useCallback(async () => {
    const flashSaleSetting = allSettings.find((s: any) => s.key === 'flash_sale_state');
    if (flashSaleSetting?.value?.ends_at) {
      const endsAt = flashSaleSetting.value.ends_at;
      if (new Date(endsAt).getTime() > Date.now()) {
        setFlashEndsAt(endsAt);
      } else {
        triggerRotation();
      }
    } else {
      triggerRotation();
    }
  }, [allSettings]);

  const triggerRotation = async () => {
    if (rotating) return; 
    setRotating(true);
    try {
      const { data: result } = await supabase.functions.invoke("rotate-flash-sale");
      if (result?.ends_at) setFlashEndsAt(result.ends_at);
      refetchProducts();
    } catch (e) {
      console.warn("Flash sale rotation failed:", e);
    } finally {
      setRotating(false);
    }
  };

  useEffect(() => {
    if (allSettings.length > 0) loadFlashState();
  }, [allSettings, loadFlashState]);

  useEffect(() => {
    const channel = supabase
      .channel("products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        console.log("[Index] Product change detected, refetching...");
        refetchProducts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchProducts]);

  const handleFlashExpired = useCallback(() => {
    triggerRotation();
  }, [rotating]);

  const isActuallyLoading = (productsLoading || categoriesLoading) && !forceShow && products.length === 0;

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
      <BizMartATMCard />
      <NewsCarousel />

      <div className="mt-5 px-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📂</span>
          <span className="font-extrabold text-sm text-secondary uppercase tracking-wide">Categories</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/categories?selected=${cat.id}`)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-[0.95] transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center shadow-sm border border-border group-hover:shadow-md group-hover:border-primary/30 transition-all">
                <span className="text-2xl">{cat.icon}</span>
              </div>
              <span className="text-[10px] text-foreground font-bold whitespace-nowrap leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {flashSaleProducts.length > 0 && flashEndsAt && (
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
              <FlashTimer endsAt={flashEndsAt} onExpired={handleFlashExpired} />
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

      <div className="mt-6 px-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🔥</span>
          <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">Popular</span>
        </div>
        <button onClick={() => navigate("/marketplace")} className="flex items-center gap-1 text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
          See All <ArrowRight className="h-3 w-3" />
        </button>
      </div>
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
