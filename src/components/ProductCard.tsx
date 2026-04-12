"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, ShoppingCart, Coins } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { storeOpen } = useAppSettings();

  // ONLY FLASH SALE CONTROLS DISCOUNT
  const isFlashSale = product.isFlashSale === true;

  // Use prices directly from the database record
  // If flash sale, sale_price is the discounted one. original_price is the old one.
  const basePrice = isFlashSale && product.original_price
    ? Number(product.original_price)
    : Number(product.price);

  const finalPrice = isFlashSale && product.sale_price && Number(product.sale_price) < basePrice
    ? Number(product.sale_price)
    : Number(product.price);

  // Dynamic calculation based on actual price difference in DB
  const discount = (isFlashSale && basePrice > finalPrice)
    ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
    : 0;

  const bcoins = Number((finalPrice * 0.10).toFixed(2));
  const stock = Number(product.stock) || 0;
  const isOutOfStock = product.stock !== undefined && stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!storeOpen) {
      toast.error("Store is currently closed");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    if (stock < 1) {
      toast.error("This product is out of stock");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: isFlashSale ? basePrice : undefined,
      image: product.image,
      category: product.category,
    });

    toast.success(`Added ${product.name} to cart!`);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!storeOpen) {
      toast.error("Store is currently closed");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    if (stock < 1) {
      toast.error("This product is out of stock");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: isFlashSale ? basePrice : undefined,
      image: product.image,
      category: product.category,
    });

    navigate("/cart");
  };

  return (
    <div
      className={`bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group ${isOutOfStock ? "opacity-75" : ""}`}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? "grayscale" : ""}`}
        />

        {isOutOfStock ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-destructive text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              Sold Out
            </span>
          </div>
        ) : (
          <>
            {/* RED DISCOUNT BADGE */}
            {isFlashSale && discount > 0 && (
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-br-xl shadow-lg flex flex-col items-center leading-none">
                  <span>{discount}%</span>
                  <span className="text-[6px] mt-0.5 uppercase tracking-tighter">OFF</span>
                </div>
              </div>
            )}

            {/* FLASH SALE TAG */}
            {isFlashSale && (
              <span className="absolute top-2 right-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm border border-black/10">
                FLASH SALE
              </span>
            )}

            {/* BCOINS */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-700">
                {bcoins} Bcoins
              </span>
            </div>
          </>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {product.sold}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {stock > 0 ? `${stock} left` : 'Sold Out'}
          </span>
        </div>

        {/* PRICE DISPLAY */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-extrabold text-primary">
            ₱{finalPrice}
          </span>

          {isFlashSale && !isOutOfStock && basePrice > finalPrice && (
            <span className="text-xs text-muted-foreground line-through decoration-red-500/50">
              ₱{basePrice}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!storeOpen || isOutOfStock}
            className="flex-1 bg-secondary text-secondary-foreground text-[10px] font-bold py-2 rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
          >
            <ShoppingCart className="h-3 w-3" /> Add
          </button>

          <button
            onClick={handleBuyNow}
            disabled={!storeOpen || isOutOfStock}
            className="flex-1 bg-primary text-primary-foreground text-[10px] font-bold py-2 rounded-lg hover:bg-primary/80 disabled:opacity-50 transition-all flex items-center justify-center"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}