"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
        })
        .select()
        .single();

      if (error) throw error;
      
      // Fix: Check if orderData is not null before accessing .id
      if (orderData) {
        setOrderId(orderData.id);
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

  // ... rest of the component remains unchanged
}