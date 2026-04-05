import { forwardRef } from "react";
import { Product } from "@/data/products";
import { Star, ShoppingCart, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const ProductCard = forwardRef<HTMLDivElement, { product: Product }>(function ProductCard({ product }, ref) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const isOutOfStock = (product.stock ?? 0) <= 0 && (product.stock !== undefined);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error("This product is out of stock");
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
    toast.success("Added to cart! 🛒");
  };

  return (
    <div
      ref={ref}
      onClick={() => navigate(`/product/${product.id}`)}
      className={`bg-card rounded-2xl overflow-hidden shadow-sm border border-border active:scale-[0.97] transition-all cursor-pointer hover:shadow-lg group ${isOutOfStock ? 'opacity-75' : ''}`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground text-[10px] font-extrabold px-3 py-1 rounded-full">
              SOLD OUT
            </span>
          </div>
        )}
        {discount > 0 && !isOutOfStock && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md">
            -{discount}%
          </span>
        )}
        {product.isFlashSale && !isOutOfStock && (
          <span className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
            ⚡ SALE
          </span>
        )}
        {!isOutOfStock && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 bg-primary text-primary-foreground p-2 rounded-xl shadow-lg active:scale-90 transition-transform"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs line-clamp-2 leading-tight mb-1.5 text-foreground font-semibold">
          {product.name}
        </p>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-primary font-extrabold text-sm">₱{product.price}</span>
            {product.originalPrice && (
              <span className="text-muted-foreground text-[10px] line-through ml-1">
                ₱{product.originalPrice}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {product.rating} · {product.sold.toLocaleString()} sold
            </span>
          </div>
        </div>
        {/* Stock indicator */}
        {product.stock !== undefined && (
          <div className="flex items-center gap-1.5 mt-1">
            {isOutOfStock ? (
              <span className="text-[9px] font-bold text-destructive">Out of stock</span>
            ) : (product.stock ?? 0) <= 5 ? (
              <span className="text-[9px] font-bold text-warning">Only {product.stock} left!</span>
            ) : (
              <span className="text-[9px] text-muted-foreground">{product.stock} in stock</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-1 mt-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-full px-2 py-0.5 w-fit">
          <span className="text-[9px]">🪙</span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            +{(product.price * 0.10).toFixed(1)} BCoins
          </span>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
