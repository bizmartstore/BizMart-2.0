import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import BannerCarousel from "@/components/BannerCarousel";
import BizMartFeatures from "@/components/BizMartFeatures";
import NewsCarousel from "@/components/NewsCarousel";
import ProductCard from "@/components/ProductCard";
import { Search, ChevronRight } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { storeOpen } = useAppSettings();

  const flashSales = products.filter(p => p.isFlashSale).slice(0, 5);
  const newArrivals = products.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <BannerCarousel />
      <BizMartFeatures />
      
      {!storeOpen && (
        <div className="mx-3 mt-3 bg-destructive/10 border border-destructive/30 rounded-lg p-2">
          <p className="text-[10px] text-destructive font-semibold text-center">Store is currently closed</p>
        </div>
      )}

      {flashSales.length > 0 && (
        <div className="mt-5 px-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="font-extrabold text-sm uppercase tracking-wide text-flash">Flash Sales</span>
            </div>
            <button onClick={() => navigate("/marketplace?filter=flash")} className="text-xs text-primary font-bold flex items-center gap-1">
              See All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {flashSales.map(p => <div key={p.id} className="w-36 flex-shrink-0"><ProductCard product={p} /></div>)}
          </div>
        </div>
      )}

      <div className="mt-5 px-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">New Arrivals</span>
          </div>
          <button onClick={() => navigate("/marketplace")} className="text-xs text-primary font-bold flex items-center gap-1">
            See All <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>

      <NewsCarousel />
      <BottomNav />
    </div>
  );
}