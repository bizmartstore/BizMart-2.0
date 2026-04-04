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
  
  // 👇 Use Manila timezone for date calculations
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayManila = now.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }).split('T')[0];
  const minTime = new Date(now.getTime() + 10 * 60 * 1000);
  const minTimeString = minTime.toTimeString().slice(0, 5);
  const noTimesToday = minTime.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) !== todayManila;

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // ... rest of component unchanged, but replace all uses of `today` with `todayManila`
  // and `minTimeString` derived from Manila timezone

  // Example: replace `const today = now.toISOString().split('T')[0];` with:
  // const todayManila = now.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }).split('T')[0];
  // use `todayManila` for date comparisons and defaults

  // In handleCheckout, replace date checks:
  // if (pickupDate !== todayManila) { ... }
  // if (noTimesToday) { ... } // recompute noTimesToday using Manila timezone

  // ... (rest of component remains same, just ensure all date logic uses Manila timezone)

  return (/* JSX */);
}