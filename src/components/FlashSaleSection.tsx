"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFlashSaleProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import { Zap, Clock, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FlashSaleSectionProps {
  title?: string;
  subtitle?: string;
  showCountdown?: boolean;
  variant?: "primary" | "secondary";
}

export default function FlashSaleSection({
  title = "🔥 Flash Sale",
  subtitle = "Limited time discounts just for you!",
  showCountdown = true,
  variant = "primary"
}: FlashSaleSectionProps) {
  const navigate = useNavigate();
  const { data: flashSaleProducts = [], isLoading } = useFlashSaleProducts();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate flash sale end time (2 hours from now)
  useEffect(() => {
    const calculateEndTime = () => {
      const now = new Date();
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
    };

    setRemainingTime(calculateEndTime());
  }, []);

  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  // Auto-scroll through products
  useEffect(() => {
    if (flashSaleProducts.length <= 4) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % (flashSaleProducts.length - 3));
    }, 5000);

    return () => clearInterval(interval);
  }, [flashSaleProducts.length]);

  const pad = (num: number) => num.toString().padStart(2, "0");
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;

  const visibleProducts = useMemo(() => {
    if (flashSaleProducts.length <= 4) return flashSaleProducts;
    return [
      ...flashSaleProducts.slice(currentIndex, currentIndex + 4),
      ...flashSaleProducts.slice(0, Math.max(0, 4 - (flashSaleProducts.length - currentIndex)))
    ];
  }, [flashSaleProducts, currentIndex]);

  if (isLoading) {
    return (
      <div className="px-3 mt-4">
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-2xl p-3.5 mb-3 shadow-lg relative overflow-hidden animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-white" />
              <div>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">{title}</h3>
                <p className="text-white/70 text-[10px] font-medium">{subtitle}</p>
              </div>
            </div>
            {showCountdown && (
              <div className="flex items-center gap-1">
                <span className="bg-white text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">--:--:--</span>
              </div>
            )}
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

  if (flashSaleProducts.length === 0) {
    return null;
  }

  return (
    <div className="px-3 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`rounded-2xl p-3.5 mb-3 shadow-lg relative overflow-hidden ${
          variant === "primary"
            ? "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
            : "bg-gradient-to-r from-purple-600 via-pink-600 to-red-500"
        }`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Zap className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">{title}</h3>
              <p className="text-white/70 text-[10px] font-medium">{subtitle}</p>
            </div>
          </div>

          {showCountdown && remainingTime > 0 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              {[pad(hours), pad(minutes), pad(seconds)].map((v, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="bg-white text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm">
                    {v}
                  </span>
                  {i < 2 && <span className="text-white font-bold text-xs">:</span>}
                </span>
              ))}
            </motion.div>
          )}

          {showCountdown && remainingTime <= 0 && (
            <span className="bg-white text-red-600 text-[10px] font-extrabold px-2 py-1 rounded-md shadow-sm">
              Flash Sale Ended
            </span>
          )}
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
            <div className="relative">
              {/* RED DISCOUNT BADGE */}
              {product.isFlashSale && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                  className="absolute top-0 left-0 z-10"
                >
                  <div className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-br-xl shadow-lg flex flex-col items-center leading-none">
                    <span>{product.discount_percent || 0}%</span>
                    <span className="text-[6px] mt-0.5 uppercase tracking-tighter">OFF</span>
                  </div>
                </motion.div>
              )}

              {/* FLASH SALE TAG */}
              {product.isFlashSale && (
                <span className="absolute top-2 right-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm border border-black/10 z-20">
                  FLASH SALE
                </span>
              )}

              {/* Product Card */}
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                <div className="p-3">
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-extrabold text-primary">
                        ₱{product.price}
                      </span>
                      {product.originalPrice && product.price < product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
                          ₱{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[10px] text-muted-foreground">
                      {product.sold} sold
                    </span>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="w-full bg-primary text-primary-foreground text-[10px] font-bold py-2 rounded-lg hover:bg-primary/80 transition-all"
                  >
                    View Details
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}