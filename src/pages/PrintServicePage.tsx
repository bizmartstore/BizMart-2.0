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
      const bwPages = selectedPages.length; // Simplified - should differentiate B&W vs color      const coloredPages = 0;
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
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      // Fix: Check if orderData is not null before accessing .id
      if (orderData) {
        setOrderId((orderData as any).id);
        setOrderComplete(true);
        toast.success("Print order submitted successfully!");
      } else {
        throw new Error("No order data returned");
      }
    } catch (error: any) {
      toast.error("Failed to submit order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Render component
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <Printer className="h-5 w-5 text-primary" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <h1 className="text-lg font-bold text-primary">Print Service</h1>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="px-4 pt-6 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Printer className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-bold text-primary">Upload Print Document</h2>
        </div>

        <div className="relative">
          <Input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-12 rounded-lg border border-primary/20 flex items-center justify-center text-primary"
          >
            {file ? <Printer className="h-6 w-6 text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
            <span className="text-[10px] text-primary mt-1">{file ? "Change File" : "Upload PDF"}</span>
          </button>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <img src={preview} alt="Preview" className="max-h-[300px] max-w-full object-cover rounded-lg" />
          </div>
        </div>

        {/* Document Settings */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="text-xs font-bold">Copies</label>
            <Input
              type="number"
              min="1"
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
              className="text-sm h-8 rounded-md border border-input bg-background px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs font-bold">Color Mode</label>
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center">
                <span className="text-xs">{colorMode === "bw" ? "B&W" : "Color"}</span>
              </div>
              <div className="ml-2">
                <button
                  onClick={() => setColorMode(colorMode === "bw" ? "color" : "bw")}
                  className="w-6 h-6 rounded-full bg-primary/20 text-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold">Page Size</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setPageSize("short")}
                className="py-1.5 rounded-lg text-xs font-bold transition-all ${
                  pageSize === "short" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }"
              >
                Short
              </button>
              <button
                onClick={() => setPageSize("long")}
                className="py-1.5 rounded-lg text-xs font-bold transition-all ${
                  pageSize === "long" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }"
              >
                Long
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="text-xs font-bold">Delivery Type</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setDeliveryType("pickup")}
                className="py-1.5 rounded-lg text-xs font-bold transition-all ${
                  deliveryType === "pickup" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }"
              >
                Pickup
              </button>
              <button
                onClick={() => setDeliveryType("delivery")}
                className="py-1.5 rounded-lg text-xs font-bold transition-all ${
                  deliveryType === "delivery" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }"
              >
                Delivery
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold">Pickup Date</label>
            <Input
              type="date"
              min={today}
              className="text-sm h-8 rounded-md border border-input bg-background px-3 py-2"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold">Pickup Time</label>
            <Input
              type="text"
              placeholder="e.g., 10:00"
              className="text-sm h-8 rounded-md border border-input bg-background px-3 py-2"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
          </div>
        </div>

        {/* Page Selection */}
        <div className="mb-4">
          <label className="text-xs font-bold">Select Pages</label>
          <div className="flex flex-wrap gap-1">
            {[Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => togglePage(pageNum)}
                className="py-1.5 rounded-lg bg-muted text-xs font-bold w-12 h-6"
              >
                {selectedPages.includes(pageNum) ? "✓" : pageNum}
              </button>
            </button>
          </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 font-bold rounded-xl"
        >
          {submitting ? "Submitting..." : "Submit Order"}
        </Button>
      </div>
    </div>
  );
}