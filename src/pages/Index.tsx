import { use client } from "react";

import TopBar from "@/components/TopBar";
import BannerCarousel from "@/components/BannerCarousel";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";
import BizMartFeatures from "@/components/BizMartFeatures";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import LiveShoutoutTicker from "@/components/LiveShoutoutTicker";
import NewsCarousel from "@/components/NewsCarousel";
import BizMartATMCard from "@/components/BizMartATMCard"; // New import
import { useProducts, useCategories } from "@/hooks/useProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useNavigate } from "react-router-dom";
import { Zap, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

// ... (rest of the file content remains the same) ...

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
      <BizMartATMCard /> <!-- New component added -->
      <NewsCarousel />

      {/* Rest of the content remains unchanged -->
    </div>
  );
