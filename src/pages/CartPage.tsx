"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingBag, Calendar, Clock, MapPin, AlertCircle } from "lucide-react";
import { format, addDays, isAfter, isBefore, startOfDay } from "date-fns";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { storeOpen } = useAppSettings();
  
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const availableTimes = useMemo(() => {
    const times = [];
    for (let hour = 8; hour < 20; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      times.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return times;
  }, []);

  const handleCheckout = async () => {
    if (!user) { navigate("/login"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time."); return; }
    
    // Ensure date is today
    if (pickupDate !== today) {
      toast.error("Please select today's date for pickup/delivery");
      setCheckingOut(false);
      return;
    }
    
    if (items.length === 0) { toast.error("Cart is empty"); return; }

    const selectedDT = new Date(`${pickupDate}T${pickupTime}`);
    const minDT = new Date();
    minDT.setMinutes(minDT.getMinutes() + 10);
    if (selectedDT < minDT) {
      toast.error("Please select a time at least 10 minutes from now.");
      setCheckingOut(false);
      return;
    }

    setCheckingOut(true);
    try {
      const { data: orderData, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            category: item.category,
          })),
          total: totalPrice + deliveryFee,
          delivery_type: deliveryType,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          delivery_fee: deliveryFee,
          bcoins_earned: totalPrice * 0.10,
          status: "pending",
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      if (orderData) {
        setOrderId((orderData as any).id);
        setOrderComplete(true);
        clearCart();
        toast.success("Order placed successfully!");
      } else {
        throw new Error("No order data returned");
      }
    } catch (error: any) {
      toast.error("Failed to place order: " + error.message);
    } finally {
      setCheckingOut(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
          <button onClick={() => navigate("/")} className="p-1.5">
            <ShoppingBag className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm ml-2">Order Confirmed</span>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold mb-3">Order Placed!</h2>
          <p className="text-sm text-muted-foreground mb-2">Your order #{orderId?.slice(0, 8)} has been received.</p>
          <p className="text-sm text-muted-foreground mb-8">You'll earn {(totalPrice * 0.10).toFixed(1)} BCoins when it's completed!</p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/orders")} className="w-full h-12 font-bold rounded-xl">
              View Orders
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12 font-bold rounded-xl">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ShoppingBag className="h-5 w-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold text-primary">Your Cart</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">Your cart is empty.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ShoppingBag className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-primary">Your Cart</h1>
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-4 py-4">
        {items.map(item => (
          <div key={item.id} className="bg-card rounded-lg p-3 border border-border flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{item.name}</p>
              <p className="text-[10px] text-muted-foreground">₱{item.price}</p>
              <div className="flex items-center gap-1 mt-1">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">₱{Number(item.price * item.quantity).toFixed(2)}</p>
            </div>
          </div>
        ))}
        <div className="border-t border-border/50 py-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Total Items: {totalItems}</span>
          <span className="text-[10px] text-primary font-bold">₱{totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Section */}
      <div className="px-4 py-6 bg-card">
        <div className="space-y-4">
          {/* Delivery Options */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold">Delivery Type</label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${deliveryType === "pickup" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  Pickup
                </button>
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${deliveryType === "delivery" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  Delivery
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold">Date</label>
              <Input
                type="date"
                min={today}
                className="text-sm h-8 rounded-md border border-input bg-background px-3 py-2"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold">Time</label>
              <Input
                type="text"
                placeholder="e.g., 10:00"
                className="text-sm h-8 rounded-md border border-input bg-background px-3 py-2"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              />
            </div>
          </div>

          {/* Delivery Fee Display */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">Delivery Fee: ₱{deliveryFee}</span>
          </div>

          {/* Total Price Display */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">Subtotal</span>
            <span className="text-[11px] font-bold text-primary">
              ₱{(totalPrice + deliveryFee).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          disabled={checkingOut || items.length === 0}
          className="w-full h-12 font-bold rounded-xl"
        >
          {checkingOut ? "Processing..." : "Place Order"}
        </Button>
      </div>
    </div>
  );
}