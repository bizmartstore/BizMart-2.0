"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
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
  const [liked, setLiked] = React.useState(false);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!storeOpen) {
      toast.error("Store is currently closed");
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
    });
    toast.success(`Added ${product.name} to cart!`);
  };

  const handleBuyNow = () => {
    if (!storeOpen) {
      toast.error("Store is currently closed");
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
    });
    navigate("/cart");
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
      <div         className="relative aspect-square cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img           src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {product.isFlashSale && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full">
            FLASH SALE
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
          className="absolute bottom-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
        >
          <Star className={`h-4 w-4 ${liked ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
        </button>
      </div>
      
      <div className="p-3">
        <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-1">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-muted-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.sold} sold)</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-extrabold text-primary">₱{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">₱{product.originalPrice}</span>
          )}
        </div>
        {/* NEW: Safely display BCoins earned */}
        <span className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-primary">
            🪙 {(product as any).bcoins ?? 0}
          </span>
          <span className="text-[9px] text-muted-foreground">BCoins earned</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!storeOpen}
            className="flex-1 bg-secondary text-secondary-foreground text-xs font-bold py-2 rounded-lg hover:bg-secondary/80 disabled:opacity-50"
          >
            <ShoppingCart className="h-3 w-3 inline mr-1" /> Add
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!storeOpen}
            className="flex-1 bg-primary text-primary-foreground text-xs font-bold py-2 rounded-lg hover:bg-primary/80 disabled:opacity-50"
          >
            <ShoppingCart className="h-3 w-3 inline mr-1" /> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}<dyad-write path="src/components/ProductCard.tsx" description="Fix TypeScript error by safely accessing bcoins property using any cast">
"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
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
  const [liked, setLiked] = React.useState(false);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!storeOpen) {
      toast.error("Store is currently closed");
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
    });
    toast.success(`Added ${product.name} to cart!`);
  };

  const handleBuyNow = () => {
    if (!storeOpen) {
      toast.error("Store is currently closed");
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
    });
    navigate("/cart");
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
      <div 
        className="relative aspect-square cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {product.isFlashSale && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full">
            FLASH SALE
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(!liked);
          }}
          className="absolute bottom-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm"
        >
          <Star className={`h-4 w-4 ${liked ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
        </button>
      </div>
      
      <div className="p-3">
        <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-1">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-muted-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.sold} sold)</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-extrabold text-primary">₱{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">₱{product.originalPrice}</span>
          )}
        </div>
        {/* NEW: Safely display BCoins earned */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-primary">
            🪙 {(product as any).bcoins ?? 0}
          </span>
          <span className="text-[9px] text-muted-foreground">BCoins earned</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!storeOpen}
            className="flex-1 bg-secondary text-secondary-foreground text-xs font-bold py-2 rounded-lg hover:bg-secondary/80 disabled:opacity-50"
          >
            <ShoppingCart className="h-3 w-3 inline mr-1" /> Add
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!storeOpen}
            className="flex-1 bg-primary text-primary-foreground text-xs font-bold py-2 rounded-lg hover:bg-primary/80 disabled:opacity-50"
          >
            <ShoppingCart className="h-3 w-3 inline mr-1" /> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}