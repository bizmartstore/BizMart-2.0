"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { Star, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturedProductsSection() {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Get top 6 products by rating and sales
  const featuredProducts = [...products]
    .sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.sold || 0) - (a.sold || 0);
    })
    .slice(0, 6);

  useEffect(() => {
    if (featuredProducts.length <= 6) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % (featuredProducts.length - 5));
    }, 6000);

    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const visibleProducts = featuredProducts.slice(currentSlide, currentSlide + 6);

  if (isLoading) {
    return (
      <div className="px-3 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-secondary" />
          <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">Featured Products</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <div className="px-3 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-secondary" />
        <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">Featured Products</span>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 gap-2.5"
      >
        {visibleProducts.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-4"
      >
        <button
          onClick={() => navigate("/marketplace")}
          className="w-full flex items-center justify-center gap-1 text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          <ArrowRight className="h-3 w-3" />
          View All Products
        </button>
      </motion.div>
    </div>
  );
}