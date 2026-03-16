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
      const { error } = await (supabase as any)
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
        });

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
          id: "new",
          items: orderItems,
          customer_name: buyerName,
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
    </div>
  );
}