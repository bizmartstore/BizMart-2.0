"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFlashSaleProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { Tag, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function DealsOfTheDaySection() {
  const navigate = useNavigate();
  const { data: flashSaleProducts = [], isLoading } = useFlashSaleProducts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll through products
  useEffect(() => {
    if (flashSaleProducts.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % (flashSaleProducts.length - 3));
    }, 5000);

    return () => clearInterval(interval);
  }, [flashSaleProducts.length]);

  const visibleProducts = useMemo(() => {
    if (flashSaleProducts.length <= 4) return flashSaleProducts;
    return [
      ...flashSaleProducts.slice(currentIndex, currentIndex + 4),
      ...flashSaleProducts.slice(0, Math.max(0, 4 - (flashSaleProducts.length - currentIndex)))
    ];
  }, [flashSaleProducts, currentIndex]);

  if (isLoading) {
    return (
      <div className="px-3 mt-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-3"
        >
          <Tag className="h-5 w-5 text-orange-500" />
          <span className="font-extrabold text-sm uppercase tracking-wide text-orange-500">Deals of the Day</span>
        </motion.div>
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

  if (flashSaleProducts.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="px-3 mt-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 mb-3"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.div
          animate={{ rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Tag className="h-5 w-5 text-orange-500" />
        </motion.div>
        <div>
          <span className="font-extrabold text-sm uppercase tracking-wide text-orange-500">Deals of the Day</span>
          <p className="text-[10px] text-muted-foreground">Best discounts available right now!</p>
        </div>
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
    </motion.div>
  );
}