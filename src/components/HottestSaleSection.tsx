"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { Flame, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HottestSaleSection() {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number>(0);
  const scrollPosRef = useRef(0);

  // Get discounted products (products with actual price difference)
  const discountedProducts = useMemo(() => {
    return products
      .filter(p => {
        const basePrice = p.originalPrice ? Number(p.originalPrice) : Number(p.price);
        const salePrice = p.sale_price ? Number(p.sale_price) : basePrice;
        return salePrice < basePrice; // Has actual discount
      })
      .sort((a, b) => {
        // Sort by highest discount percentage
        const aBase = a.originalPrice ? Number(a.originalPrice) : Number(a.price);
        const aSale = a.sale_price ? Number(a.sale_price) : aBase;
        const aDiscount = Math.round(((aBase - aSale) / aBase) * 100);

        const bBase = b.originalPrice ? Number(b.originalPrice) : Number(b.price);
        const bSale = b.sale_price ? Number(b.sale_price) : bBase;
        const bDiscount = Math.round(((bBase - bSale) / bBase) * 100);

        return bDiscount - aDiscount;
      });
  }, [products]);

  useEffect(() => {
  const container = scrollRef.current;
  if (!container || discountedProducts.length < 2) return;

  let lastTime = 0;
  const speed = 0.2; // 🔥 adjust for slower/faster movement

  // start from right side
  const maxScroll = container.scrollWidth - container.clientWidth;
  scrollPosRef.current = maxScroll;
  container.scrollLeft = maxScroll;

  const animate = (time: number) => {
    if (!isPaused && container) {
      const delta = lastTime ? time - lastTime : 16;
      lastTime = time;

      // 👉 MOVE LEFT (smooth)
      scrollPosRef.current += speed * (delta / 16);

      // 👉 LOOP RESET (infinite scroll)
      if (scrollPosRef.current >= maxScroll) {
        scrollPosRef.current = 0;
      }

      container.scrollLeft = scrollPosRef.current;
    } else {
      lastTime = 0;
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  animationRef.current = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationRef.current);
  };
}, [discountedProducts.length, isPaused]);

  // Handle interaction start/end for pause
  const handleInteractionStart = () => setIsPaused(true);
  const handleInteractionEnd = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollPosRef.current = scrollRef.current.scrollLeft;
      setIsPaused(false);
    }, 2000);
  };

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

  if (discountedProducts.length === 0) {
    return null;
  }

  const maxDiscount = discountedProducts.length > 0
  ? Math.round(
      ((Number(discountedProducts[0].originalPrice || discountedProducts[0].price) -
        Number(discountedProducts[0].sale_price || discountedProducts[0].price)) /
        Number(discountedProducts[0].originalPrice || discountedProducts[0].price)) * 100
    )
  : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="px-3 mt-4"
    >
      {/* Hottest Sale Header with Fire Animation */}
      <div className="flex items-center justify-between mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
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
              Limited time discounts - up to {maxDiscount}% OFF!
            </p>
          </div>
        </motion.div>
        <button
          onClick={() => navigate("/marketplace")}
          className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1 shadow-lg hover:bg-red-700 transition-colors"
        >
          <ArrowRight className="h-3 w-3" />
          See All
        </button>
      </div>

      {/* HORIZONTAL SCROLLING CONTAINER - SLOW CONTINUOUS MOVEMENT with swipe support */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
      >
        {discountedProducts.slice(0, 4).map((product) => {
          // Calculate discount
          const basePrice = product.originalPrice ? Number(product.originalPrice) : Number(product.price);
          const salePrice = product.sale_price ? Number(product.sale_price) : basePrice;
          const discountPercent = Math.round(((basePrice - salePrice) / basePrice) * 100);

          return (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 w-40"
              onClick={() => navigate(`/product/${product.id}`)}
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
                    <span className="text-lg">{discountPercent}%</span>
                    <span className="text-[6px] mt-0.5 uppercase tracking-tighter">OFF</span>
                  </div>
                </motion.div>

                {/* Enhanced Product Card */}
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-3">
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-1">
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-extrabold text-primary">₱{product.price}</span>
                        {basePrice > salePrice && (
                          <span className="text-xs text-muted-foreground line-through decoration-red-500/50 ml-1">
                            ₱{basePrice}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-[10px] text-muted-foreground">
                        {product.sold} sold
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-primary text-primary-foreground text-[10px] font-bold py-2 rounded-lg hover:bg-primary/80 transition-all"
                    >
                      View Details
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

    </motion.div>
  );
}