"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { Flame, ArrowRight, Sparkles, Percent } from "lucide-react";
import { motion } from "framer-motion";

export default function HottestSaleSection() {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate discount percentage for each product
  const productsWithDiscount = useMemo(() => {
    return products
      .filter(p => p.isFlashSale === true)
      .map(product => {
        const basePrice = product.originalPrice ? Number(product.originalPrice) : Number(product.price);
        const salePrice = product.sale_price ? Number(product.sale_price) : basePrice;
        const discountPercent = basePrice > salePrice
          ? Math.round(((basePrice - salePrice) / basePrice) * 100)
          : 0;
        return { ...product, discountPercent };
      })
      .filter(p => p.discountPercent > 0) // Only products with actual discount
      .sort((a, b) => b.discountPercent - a.discountPercent); // Sort by highest discount
  }, [products]);

  // Auto-scroll through products
  useEffect(() => {
    if (productsWithDiscount.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % (productsWithDiscount.length - 3));
    }, 5000);

    return () => clearInterval(interval);
  }, [productsWithDiscount.length]);

  const visibleProducts = useMemo(() => {
    if (productsWithDiscount.length <= 4) return productsWithDiscount;
    return [
      ...productsWithDiscount.slice(currentIndex, currentIndex + 4),
      ...productsWithDiscount.slice(0, Math.max(0, 4 - (productsWithDiscount.length - currentIndex)))
    ];
  }, [productsWithDiscount, currentIndex]);

  if (isLoading) {
    return (
      <div className="px-3 mt-4">
        {/* Loading skeleton */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-2xl p-4 mb-4 shadow-lg relative overflow-hidden animate-pulse">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-xl p-2">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg uppercase tracking-wide">Hottest Sale!</h3>
              <p className="text-white/70 text-[11px] font-medium">Limited time discounts - up to 50% OFF!</p>
            </div>
          </div>
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

  if (productsWithDiscount.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="px-3 mt-4"
    >
      {/* Hottest Sale Header with Fire Animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl p-4 mb-4 shadow-lg relative overflow-hidden ${
          isHovered ? "ring-2 ring-orange-500" : ""
        }`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <Flame className="h-8 w-8 text-red-600 drop-shadow-lg" />
            </motion.div>
            <div>
              <h3 className="font-extrabold text-red-600 text-lg uppercase tracking-wide">
                Hottest Sale!
              </h3>
              <p className="text-red-600/80 text-[11px] font-medium">
                Limited time discounts - up to {Math.max(...productsWithDiscount.map(p => p.discountPercent))}% OFF!
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/marketplace")}
            className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1 shadow-lg"
          >
            <ArrowRight className="h-3 w-3" />
            View All
          </motion.button>
        </div>
      </motion.div>

      {/* Products Grid with Discount Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-2 gap-2 overflow-x-auto scrollbar-hide pb-2"
      >
        {visibleProducts.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 w-36"
          >
            <div className="relative">
              {/* Discount Badge - BIG and RED */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
                className="absolute top-0 left-0 z-20"
              >
                <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-br-xl shadow-lg flex flex-col items-center leading-none">
                  <span className="text-lg">{product.discountPercent}%</span>
                  <span className="text-[6px] mt-0.5 uppercase tracking-tighter">OFF</span>
                </div>
              </motion.div>

              {/* Product Card */}
              <ProductCard product={product} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Floating Sparkles Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-3 flex justify-center"
      >
        <div className="relative">
          {[...Array(8)].map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
              className="absolute text-yellow-400 text-lg"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              ✨
            </motion.span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}