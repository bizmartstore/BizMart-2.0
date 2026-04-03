import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Plus, Minus, Calendar, Clock, Loader2, MapPin, Truck } from "lucide-react";
import { sendNotification, notifyCustomerOrder } from "@/lib/notifications";

async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isLockError = error?.message?.includes('lock') || 
                         error?.message?.includes('steal') || 
                         error?.name === 'AbortError' ||
                         error?.code === '40P01';
      
      if (isLockError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const { storeOpen, gcashFee } = useAppSettings();
  
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Calculate minimum time (10 minutes from now) and end of day
  const { minTimeString, endOfDayString, initialTime } = useMemo(() => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 10 * 60000); // 10 minutes from now
    const minTimeString = minTime.toTimeString().slice(0, 5);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const endOfDayString = endOfDay.toTimeString().slice(0, 5);
    return { minTimeString, endOfDayString, initialTime: minTimeString };
  }, []);

  // Set initial values for date and time
  useEffect(() => {
    setPickupDate(today);
    setPickupTime(initialTime);
  }, [today, initialTime]);

  const deliveryFee = deliveryType === "delivery" ? gcashFee : 0;
  const grandTotal = totalPrice + deliveryFee;

  const handleCheckout = async () => {
    if (!user) { navigate("/login"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time."); return; }
    if (items.length === 0) { toast.error("Cart is empty"); return; }

    const selectedDT = new Date(`${pickupDate}T${pickupTime}`);
    const minDT = new Date();
    minDT.setMinutes(minDT.getMinutes() + 10);
    if (selectedDT < minDT) {
      toast.error("Please select a time at least 10 minutes from now.");
      return;
    }

    setCheckingOut(true);
    try {
      const productIds = items.map(i => i.id);
      const { data: productData, error: stockError } = await (supabase as any)
        .from('products')
        .select('id, stock, name')
        .in('id', productIds);
      
      if (stockError) throw stockError;

      if (productData) {
        for (const item of items) {
          const product = productData.find((p: any) => p.id === item.id);
          if (product && product.stock < item.quantity) {
            toast.error(`"${item.name}" only has ${product.stock} left in stock.`);
            setCheckingOut(false);
            return;
          }
        }
      }

      const bcoinsEarned = Number((totalPrice * 0.10).toFixed(1));
      const adminCommission = Number((totalPrice * 0.10).toFixed(2));
      const sellerEarnings = Number((totalPrice - adminCommission).toFixed(2));
      const orderItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      }));

      const customerName = profile ? `${profile.first_name} ${profile.last_name}` : "Customer";
      
      const { data: insertedOrder, error: orderError } = await (supabase as any)
        .from("orders")
        .insert({
          user_id: user.id,
          items: orderItems,
          total: grandTotal,
          bcoins_earned: bcoinsEarned,
          status: "pending",
          delivery_type: deliveryType,
          delivery_fee: deliveryFee,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          admin_commission: adminCommission,
          seller_earnings: sellerEarnings,
          customer_name: customerName,
          customer_section: profile?.section ?? null,
          customer_grade_level: profile?.grade_level ?? null,
          customer_contact: profile?.email ?? null,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      for (const item of items) {
        const product = productData?.find((p: any) => p.id === item.id);
        if (product) {
          await withRetry(async () => {
            const { error } = await (supabase as any)
              .from('products')
              .update({ stock: product.stock - item.quantity })
              .eq('id', item.id);
            if (error) throw error;
          });
        }
      }

      const buyerName = profile ? `${profile.first_name} ${profile.last_name}` : "Customer";
      const typeLabel = deliveryType === "delivery" ? "🚚 Delivery" : "📦 Pickup";
      
      try {
        await sendNotification({
          title: "🛒 New Purchase Order",
          message: `${buyerName} placed a ${typeLabel} order for ₱${grandTotal.toLocaleString()} (${items.length} items)`,
          icon: "🛒",
          link: "/admin?tab=orders",
          type: "new_order",
          targetRole: "admin",
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn("Failed to send admin notification:", e);
      }

      try {
        await notifyCustomerOrder(user.id, "placed");
      } catch (e) {
        console.warn("Failed to send customer notification:", e);
      }

      clearCart();
      toast.success("Order placed! Waiting for admin approval.");
      navigate("/orders");
    } catch (e: any) {
      console.error("Checkout error:", e);
      toast.error(e.message || "Checkout failed. Please try again.");
    }
    setCheckingOut(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-muted-foreground mb-6">Start shopping to add items to your cart.</p>
          <Button onClick={() => navigate("/")}>Browse Products</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      <div className="px-3 mt-4">
        <h1 className="font-extrabold text-lg mb-4">Shopping Cart ({totalItems})</h1>

        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <div key={item.id} className="bg-card rounded-xl p-3 border border-border flex gap-3">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground line-clamp-2">{item.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-extrabold text-primary">₱{item.price}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => removeItem(item.id)} className="ml-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <h2 className="font-bold text-sm mb-3">Delivery Method</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setDeliveryType("pickup")}
              className={`p-3 rounded-xl border text-center transition-all ${deliveryType === "pickup" ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
            >
              <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
              <span className="text-xs font-bold">Pickup</span>
            </button>
            <button
              onClick={() => setDeliveryType("delivery")}
              className={`p-3 rounded-xl border text-center transition-all ${deliveryType === "delivery" ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
            >
              <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
              <span className="text-xs font-bold">Delivery</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</Label>
              <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} min={today} max={today} className="text-xs h-8" />
            </div>
            <div>
              <Label className="text-[10px] flex items-center gap-1"><Clock className="h-3 w-3" /> Time</Label>
              <Input type="time" value={pickupTime} min={minTimeString} max={endOfDayString} onChange={(e) => setPickupTime(e.target.value)} className="text-xs h-8" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold">₱{totalPrice.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-bold">₱{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-extrabold text-primary text-lg">₱{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>BCoins to earn</span>
              <span className="text-warning font-bold">+{(totalPrice * 0.10).toFixed(1)} 🪙</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={checkingOut || !storeOpen}
          className="w-full h-12 font-bold rounded-xl text-base"
        >
          {checkingOut ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {checkingOut ? "Processing..." : `Checkout ₱${grandTotal.toFixed(2)}`}
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}