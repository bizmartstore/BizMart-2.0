import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, Star, ShoppingCart, Share2, Heart, Minus, Plus, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ImageCarouselModal from "@/components/ImageCarouselModal";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, totalItems } = useCart();
  const product = useProduct(id || '');
  const { storeOpen } = useAppSettings();
  const [liked, setLiked] = useState(false);
  const [qty, setQty] = useState(1);
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (!product) return <div className="p-8 text-center">Product not found</div>;

  // ✅ ONLY FLASH SALE CONTROLS DISCOUNT
  const isFlashSale = product.isFlashSale === true;
  
  const basePrice = isFlashSale ? Number((product as any).original_price || product.originalPrice || product.price) : product.price;
  const finalPrice = isFlashSale ? Number((product as any).sale_price || product.price) : product.price;

  const discount = isFlashSale && basePrice > finalPrice
    ? Math.round((1 - finalPrice / basePrice) * 100)
    : 0;

  const stock = Number(product.stock) || 0;
  const isOutOfStock = product.stock !== undefined && stock <= 0;

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % allImages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [allImages.length]);

  const handleAddToCart = () => {
    if (!storeOpen) {
      toast.error("Store is currently closed");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    if (qty > stock && product.stock !== undefined) {
      toast.error(`Only ${stock} items available in stock`);
      return;
    }

    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: finalPrice,
        originalPrice: isFlashSale ? basePrice : undefined,
        image: product.image,
        category: product.category,
      });
    }
    toast.success(`Added ${qty}x ${product.name} to cart!`);
  };

  const openCarouselAt = (index: number) => {
    setCarouselIndex(index);
    setShowCarousel(true);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
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

      <div className="relative aspect-square">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale' : ''}`} 
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20">
            <span className="bg-destructive text-white text-xs font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-2xl scale-110">
              Sold Out
            </span>
          </div>
        )}

        {!isOutOfStock && allImages.length > 1 && (
          <div 
            className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-2.5 shadow-lg z-10 cursor-pointer"
            onClick={() => openCarouselAt(carouselIndex)}
          >
            <div className="flex items-center justify-center">
              <img
                src={allImages[carouselIndex]}
                alt={`Thumbnail ${carouselIndex + 1}`}
                className="h-16 w-16 object-cover rounded-lg transition-all"
                style={{ 
                  border: '2px solid white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
              />
            </div>
            <div className="flex justify-center gap-1.5 mt-2">
              {allImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${idx === carouselIndex ? 'bg-white w-3' : 'bg-white/50 w-1.5'}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* ✅ SHOW DISCOUNT ONLY IF FLASH SALE */}
        {isFlashSale && discount > 0 && !isOutOfStock && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
            -{discount}%
          </span>
        )}
        
        {/* ✅ FLASH SALE TAG */}
        {isFlashSale && !isOutOfStock && (
          <span className="absolute top-3 right-16 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-0.5">
            ⚡ FLASH SALE
          </span>
        )}
      </div>

      <div className="px-4 py-3 bg-card">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl font-extrabold text-primary">₱{finalPrice}</span>
          {isFlashSale && basePrice > finalPrice && !isOutOfStock && (
            <span className="text-sm text-muted-foreground line-through">₱{basePrice}</span>
          )}
        </div>
        <h1 className="text-base font-bold leading-snug">{product.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span className="text-xs font-semibold">{product.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">{product.sold.toLocaleString()} sold</span>
          {isOutOfStock ? (
            <span className="text-xs font-black text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">SOLD OUT</span>
          ) : product.stock !== undefined ? (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${stock <= 5 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-[hsl(var(--success))]'}`}>
              <Package className="h-3 w-3" />
              {stock} left
            </span>
          ) : null}
          <button onClick={() => setLiked(!liked)} className="ml-auto">
            <Heart className={`h-5 w-5 ${liked ? "fill-flash text-flash" : "text-muted-foreground"}`} />
          </button>
        </div>
      </div>

      <div className="mt-2 px-4 py-3 bg-card">
        <h2 className="font-bold text-sm mb-2">Product Description</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
      </div>

      {!isOutOfStock && (
        <div className="mt-2 px-4 py-3 bg-card flex items-center justify-between">
          <span className="text-sm font-semibold">Quantity</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setQty(Math.max(1, qty - 1))} 
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center active:bg-muted"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-black w-6 text-center">{qty}</span>
            <button 
              onClick={() => setQty(Math.min(qty + 1, stock))} 
              className="h-8 w-8 rounded-full border border-border flex items-center justify-center active:bg-muted"
              disabled={qty >= stock}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {!storeOpen && (
        <div className="mt-2 mx-4 bg-destructive/10 border border-destructive/30 rounded-lg p-2">
          <p className="text-[10px] text-destructive font-semibold text-center uppercase tracking-tight">Store is closed — purchases are disabled</p>
        </div>
      )}

      <div className="fixed bottom-14 left-0 right-0 z-40 bg-card border-t border-border px-3 py-2 flex gap-2 shadow-2xl">
        <button
          onClick={handleAddToCart}
          disabled={!storeOpen || isOutOfStock}
          className={`flex-1 font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${isOutOfStock ? 'bg-muted text-muted-foreground grayscale' : 'bg-secondary text-secondary-foreground active:scale-95'}`}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
        </button>
        <button
          onClick={() => {
            if (!storeOpen) { toast.error("Store is currently closed"); return; }
            if (isOutOfStock) { toast.error("This product is out of stock"); return; }
            handleAddToCart(); navigate("/cart");
          }}
          disabled={!storeOpen || isOutOfStock}
          className={`flex-1 font-bold text-sm py-3 rounded-xl transition-all ${storeOpen && !isOutOfStock ? 'bg-primary text-primary-foreground active:scale-95 shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground grayscale'}`}
        >
          Buy Now
        </button>
      </div>

      {!isOutOfStock && (
        <ImageCarouselModal 
          images={allImages}
          isOpen={showCarousel} 
          onClose={() => setShowCarousel(false)} 
        />
      )}

      <BottomNav />
    </div>
  );
}