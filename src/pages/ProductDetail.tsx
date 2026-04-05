import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, Star, ShoppingCart, Share2, Heart, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, totalItems } = useCart();
  const product = useProduct(id || '');
  const { storeOpen } = useAppSettings();
  const [liked, setLiked] = useState(false);
  const [qty, setQty] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);

  const images = product && (product as any).images && (product as any).images.length > 0 
    ? (product as any).images 
    : product?.image ? [product.image] : [];

  // Auto-switch images every 4 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  if (!product) return <div className="p-8 text-center">Product not found</div>;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0 && product.stock !== undefined;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
      });
    }
    toast.success(`Added ${qty}x ${product.name} to cart!`);
  };

  const handlePrevImage = () => {
    setCurrentImage(prev => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImage(prev => (prev + 1) % images.length);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-md flex items-center justify-between px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/cart")} className="p-1.5 relative">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-flash text-flash-foreground text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                {totalItems}
              </span>
            )}
          </button>
          <button className="p-1.5">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image Carousel */}
      <div className="relative aspect-square bg-muted">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImage]}
              alt={product.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentImage ? "w-4 bg-white" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-6xl">📦</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3 bg-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl font-extrabold text-primary">₱{product.price}</span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-muted-foreground line-through">₱{product.originalPrice}</span>
              <span className="bg-flash/10 text-flash text-xs font-bold px-1.5 py-0.5 rounded">-{discount}%</span>
            </>
          )}
        </div>
        <h1 className="text-base font-bold leading-snug">{product.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-xs font-semibold">{product.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">{product.sold.toLocaleString()} sold</span>
          {isOutOfStock ? (
            <span className="text-xs font-bold text-destructive">SOLD OUT</span>
          ) : stock <= 5 && product.stock !== undefined ? (
            <span className="text-xs font-bold text-warning">Only {stock} left!</span>
          ) : product.stock !== undefined ? (
            <span className="text-xs text-muted-foreground">{stock} in stock</span>
          ) : null}
          <button onClick={() => setLiked(!liked)} className="ml-auto">
            <Heart className={`h-5 w-5 ${liked ? "fill-flash text-flash" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-2 px-4 py-3 bg-card">
        <h2 className="font-bold text-sm mb-2">Product Description</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
      </div>

      {/* Quantity Selector */}
      <div className="mt-2 px-4 py-3 bg-card flex items-center justify-between">
        <span className="text-sm font-semibold">Quantity</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-7 w-7 rounded-full border border-border flex items-center justify-center" disabled={isOutOfStock}>
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm font-bold w-6 text-center">{qty}</span>
          <button onClick={() => setQty(Math.min(qty + 1, stock > 0 ? stock : 99))} className="h-7 w-7 rounded-full border border-border flex items-center justify-center" disabled={isOutOfStock}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Store closed notice */}
      {!storeOpen && (
        <div className="mt-2 mx-4 bg-destructive/10 border border-destructive/30 rounded-lg p-2">
          <p className="text-[10px] text-destructive font-semibold text-center">Store is closed — you can add to cart but purchases are disabled</p>
        </div>
      )}

      {/* Bottom Action */}
      <div className="fixed bottom-14 left-0 right-0 z-40 bg-card border-t border-border px-3 py-2 flex gap-2">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`flex-1 font-bold text-sm py-3 rounded-lg flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-muted text-muted-foreground' : 'bg-secondary text-secondary-foreground'}`}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button
          onClick={() => {
            if (!storeOpen) { toast.error("Store is currently closed"); return; }
            if (isOutOfStock) { toast.error("This product is out of stock"); return; }
            handleAddToCart(); navigate("/cart");
          }}
          disabled={!storeOpen || isOutOfStock}
          className={`flex-1 font-bold text-sm py-3 rounded-lg ${storeOpen && !isOutOfStock ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          Buy Now
        </button>
      </div>

      <BottomNav />
    </div>
  );
}