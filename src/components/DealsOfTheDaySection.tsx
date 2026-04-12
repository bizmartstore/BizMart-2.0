"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { Tag, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function DealsOfTheDaySection() {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get products with highest discount
  const dealProducts = [...products]
    .filter(p => p.isFlashSale === true)
    .sort((a, b) => {
      const aDiscount = a.isFlashSale && a.originalPrice && a.price ? Math.round(((a.originalPrice - a.price) / a.originalPrice) * 100) : 0;
      const bDiscount = b.isFlashSale && b.originalPrice && b.price ? Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100) : 0;
      return bDiscount - aDiscount;
    })
    .slice(0, 8);

  useEffect(() => {
    if (dealProducts.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % (dealProducts.length - 3));
    }, 6000);

    return () => clearInterval(interval);
  }, [dealProducts.length]);

  const visibleProducts = dealProducts.slice(currentIndex, currentIndex + 4);

  if (isLoading) {
    return (
      <div className="px-3 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-5 w-5 text-orange-500" />
          <span className="font-extrabold text-sm uppercase tracking-wide text-orange-500">Deals of the Day</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse">
              <div className="h-24 bg-muted rounded-lg mb-2"></div>
              <div className="h-3 bg-muted rounded mb-1"></div>
              <div className="h-2 bg-muted rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (dealProducts.length === 0) {
    return null;
  }

  return (
    <div className="px-3 mt-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 mb-3"
      >
        <Tag className="h-5 w-5 text-orange-500" />
        <span className="font-extrabold text-sm uppercase tracking-wide text-orange-500">Deals of the Day</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-2 gap-2 overflow-x-auto scrollbar-hide pb-2"
      >
        {visibleProducts.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 w-36"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-2"
      >
        <button
          onClick={() => navigate("/marketplace")}
          className="w-full flex items-center justify-center gap-1 text-xs text-orange-500 font-bold bg-orange-500/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          <ArrowRight className="h-3 w-3" />
          View All Deals
        </button>
      </motion.div>
    </div>
  );
}