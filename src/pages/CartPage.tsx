import { useCart } from "@/context/CartContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, MapPin, Truck, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { notifyCustomerOrder, notifyCustomerBCoins } from "@/lib/notifications";
import { sendNotification } from "@/lib/notifications";
import { sendTelegramOrderNotify } from "@/lib/telegramNotify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getMinDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  const dateStr = now.toISOString().slice(0, 10);
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  return { date: dateStr, time: `${hours}:${mins}` };
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { storeOpen } = useAppSettings();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const min = useMemo(() => getMinDateTime(), []);
  const [pickupDate, setPickupDate] = useState(min.date);
  const [pickupTime, setPickupTime] = useState(min.time);

  const deliveryFee = deliveryType === "delivery" ? 5 : 0;
  const grandTotal = totalPrice + deliveryFee;

  const handleCheckout = async () => {
    if (!user) { navigate("/login"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time."); return; }

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
      const { data: productData } = await (supabase as any).from('products').select('id, stock, name').in('id', productIds);
      
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
      const { data: insertedOrder, error } = await (supabase as any)
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
          customer_section: profile?.section || "",
          customer_grade_level: profile?.grade_level || "",
          customer_contact: profile?.email || "",
        })
        .select()
        .single();

      if (error) throw error;

      // Notify admin and customer - AWAIT these so they complete before navigation
      const buyerName = profile ? `${profile.first_name} ${profile.last_name}` : "Customer";
      const typeLabel = deliveryType === "delivery" ? "🚚 Delivery" : "📦 Pickup";
      
      await Promise.all([
        sendNotification({
          title: "🛒 New Purchase Order",
          message: `${buyerName} placed a ${typeLabel} order for ₱${grandTotal.toLocaleString()} (${items.length} items)`,
          icon: "🛒",
          link: "/admin?tab=orders",
          type: "new_order",
          targetRole: "admin",
        }),
        notifyCustomerOrder(user.id, "placed"),
        sendTelegramOrderNotify("pending", {
          id: insertedOrder.id,
          items: orderItems,
          customer_name: customerName,
          customer_grade_level: profile?.grade_level || "",
          customer_section: profile?.section || "",
          customer_contact: profile?.email || "",
          total: grandTotal,
          delivery_type: deliveryType,
        })
      ]);

      clearCart();
      toast.success("Order placed! Waiting for admin approval.");
      navigate("/orders");
    } catch (e: any) {
      toast.error(e.message || "Checkout failed");
    }
    setCheckingOut(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-secondary flex items-center px-3 py-2.5 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ArrowLeft className="h-5 w-5 text-secondary-foreground" />
          </button>
          <span className="font-bold text-sm ml-2 text-secondary-foreground">Shopping Cart</span>
        </div>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Your cart is empty</p>
          <button
            onClick={() => navigate("/")}
            className="bg-primary text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-xl"
          >
            Start Shopping
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-44">
      <div className="sticky top-0 z-40 bg-secondary flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ArrowLeft className="h-5 w-5 text-secondary-foreground" />
          </button>
          <span className="font-bold text-sm ml-2 text-secondary-foreground">Cart ({items.length})</span>
        </div>
        <button onClick={() => { clearCart(); toast.success("Cart cleared"); }} className="text-xs text-primary font-semibold">
          Clear All
        </button>
      </div>

      <div className="px-3 py-2 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-card rounded-xl p-3 flex gap-3 border border-border shadow-sm">
            <img
              src={item.image}
              alt={item.name}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0 cursor-pointer"
              onClick={() => navigate(`/product/${item.id}`)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold line-clamp-2 leading-tight">{item.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-primary font-extrabold text-sm">₱{item.price}</span>
                {item.originalPrice && (
                  <span className="text-[10px] text-muted-foreground line-through">₱{item.originalPrice}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center bg-muted">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center bg-muted">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-1.5">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-3 mt-3 bg-card rounded-xl border border-border p-3 space-y-3">
        <p className="text-xs font-bold text-foreground">Fulfillment Method</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDeliveryType("pickup")}
            className={`rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition-all ${
              deliveryType === "pickup" ? "border-primary bg-primary/10" : "border-border bg-muted/30"
            }`}  
          >
            <MapPin className={`h-5 w-5 ${deliveryType === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-xs font-bold ${deliveryType === "pickup" ? "text-primary" : "text-muted-foreground"}`}>Pickup</span>
            <span className="text-[10px] text-muted-foreground">Free</span>
          </button>
          <button
            onClick={() => setDeliveryType("delivery")}
            className={`rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition-all ${
              deliveryType === "delivery" ? "border-primary bg-primary/10" : "border-border bg-muted/30"
            }`}  
          >
            <Truck className={`h-5 w-5 ${deliveryType === "delivery" ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-xs font-bold ${deliveryType === "delivery" ? "text-primary" : "text-muted-foreground"}`}>Delivery</span>
            <span className="text-[10px] text-primary font-semibold">+₱5.00</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] font-bold flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3" /> Date
            </Label>
            <Input
              type="date"
              value={pickupDate}
              min={min.date}
              onChange={(e) => setPickupDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div>
            <Label className="text-[10px] font-bold flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3" /> Time
            </Label>
            <Input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>
        <p className="text-[9px] text-muted-foreground">⏰ Must be at least 10 minutes from now</p>
      </div>

      <div className="mx-3 mt-2 bg-accent rounded-xl p-3 border border-primary/20">
        <p className="text-[11px] text-accent-foreground font-semibold">
          🪙 You'll earn <strong className="text-primary">{(totalPrice * 0.10).toFixed(1)} BCoins</strong> from this purchase!
        </p>
      </div>

      {!storeOpen && (
        <div className="mx-3 bg-destructive/10 border border-destructive/30 rounded-xl p-2 mt-2">
          <p className="text-[10px] text-destructive font-semibold text-center">Store is closed — checkout is disabled</p>
        </div>
      )}

      <div className="fixed bottom-14 left-0 right-0 z-40 bg-card border-t border-border px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Subtotal</span>
          <span className="text-xs font-bold">₱{totalPrice.toLocaleString()}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Delivery Fee</span>
            <span className="text-xs font-bold text-primary">+₱{deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-lg font-extrabold text-primary ml-1">₱{grandTotal.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={!storeOpen || checkingOut}
            className={`font-bold text-sm px-8 py-2.5 rounded-xl transition-all ${
              storeOpen ? 'bg-primary text-primary-foreground shadow-md active:scale-95' : 'bg-muted text-muted-foreground'
            }`}  
          >
            {checkingOut ? "Placing Order..." : "Confirm Order"}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}