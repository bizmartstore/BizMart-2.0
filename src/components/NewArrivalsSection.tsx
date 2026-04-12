"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { PackagePlus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function NewArrivalsSection() {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get newest products (by created_at)
  const newArrivals = [...products]
    .sort((a, b) => {
      const dateA = new Date((a as any).created_at || 0).getTime();
      const dateB = new Date((b as any).created_at || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 8);

  useEffect(() => {
    if (newArrivals.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % (newArrivals.length - 3));
    }, 6000);

    return () => clearInterval(interval);
  }, [newArrivals.length]);

  const visibleProducts = newArrivals.slice(currentIndex, currentIndex + 4);

  if (isLoading) {
    return (
      <div className="px-3 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <PackagePlus className="h-5 w-5 text-green-500" />
          <span className="font-extrabold text-sm uppercase tracking-wide text-green-500">New Arrivals</span>
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

  if (newArrivals.length === 0) {
    return null;
  }

  return (
    <div className="px-3 mt-6">
      <div className="flex items-center justify-between mb-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <PackagePlus className="h-5 w-5 text-green-500" />
          <span className="font-extrabold text-sm uppercase tracking-wide text-green-500">New Arrivals</span>
        </motion.div>
        <button
          onClick={() => navigate("/marketplace")}
          className="text-xs text-green-500 font-bold flex items-center gap-1 hover:text-green-500/80 transition-colors"
        >
          See All <ArrowRight className="h-3 w-3" />
        </button>
      </div>

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

    </div>
  );
}