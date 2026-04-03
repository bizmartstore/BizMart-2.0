"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Upload, FileText, Printer, Calendar, Clock, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, addDays } from "date-fns";
import html2canvas from "html2canvas";

export default function PrintServicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { storeOpen } = useAppSettings();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [pageSize, setPageSize] = useState<"short" | "long">("short");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const availableTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      toast.error("Please upload a PDF file only");
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);

    // Count pages using pdf.js (simplified - you may need to adjust based on your PDF library)
    // For now, we'll assume user manually enters page count or we can integrate pdf.js
    setTotalPages(1); // Default, should be replaced with actual page count
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages(prev =>
      prev.includes(pageNum)
        ? prev.filter(p => p !== pageNum)
        : [...prev, pageNum]
    );
  };

  const handleSubmit = async () => {
    if (!user || !file || selectedPages.length === 0) return;
    if (!pickupTime) {
      toast.error("Please select pickup/delivery time");
      return;
    }
    
    // Ensure date is today
    if (pickupDate !== today) {
      toast.error("Please select today's date for pickup/delivery");
      return;
    }
    
    // Validate: time must be at least 10 minutes from now
    const selectedDT = new Date(`${today}T${pickupTime}`);
    const now = new Date();
    const minDT = new Date(now.getTime() + 10 * 60000);
    
    if (selectedDT < minDT) {
      toast.error("Pickup time must be at least 10 minutes from now");
      return;
    }

    setSubmitting(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("print-orders")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("print-orders")
        .getPublicUrl(fileName);

      // Calculate cost
      const bwPages = selectedPages.length; // Simplified - should differentiate B&W vs color
      const coloredPages = 0;
      const baseCost = pageSize === "short" ? 5 : 8;
      const totalCost = (bwPages * baseCost) + (coloredPages * baseCost * 2) + (deliveryType === "delivery" ? 50 : 0);

      // Create order
      const { data: orderData, error } = await supabase
        .from("print_orders")
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_name: file.name,
          total_pages: totalPages,
          bw_pages: bwPages,
          colored_pages: coloredPages,
          page_size: pageSize,
          delivery_type: deliveryType,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          cost: totalCost,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      setOrderId(orderData.id);
      setOrderComplete(true);
      toast.success("Print order submitted successfully!");
    } catch (error: any) {
      toast.error("Failed to submit order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ... rest of the component remains unchanged
}