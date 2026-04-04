"use client";

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Printer, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
  const [totalPages, setTotalPages] = useState(1);
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

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
    setTotalPages(1);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const calculateCost = () => {
    const baseCost = pageSize === "short" ? 5 : 8;
    const colorMultiplier = colorMode === "color" ? 2 : 1;
    const pageCost = totalPages * baseCost * colorMultiplier * copies;
    const deliveryCost = deliveryType === "delivery" ? 50 : 0;
    return pageCost + deliveryCost;
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/login"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    if (!file) { toast.error("Please upload a PDF file"); return; }
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time"); return; }
    
    if (pickupDate !== today) {
      toast.error("Please select today's date for pickup/delivery");
      return;
    }
    
    const selectedDT = new Date(`${today}T${pickupTime}`);
    const now = new Date();
    const minDT = new Date(now.getTime() + 10 * 60000);
    
    if (selectedDT < minDT) {
      toast.error("Pickup time must be at least 10 minutes from now");
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("print-orders")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("print-orders")
        .getPublicUrl(fileName);

      const bwPages = colorMode === "bw" ? totalPages : 0;
      const coloredPages = colorMode === "color" ? totalPages : 0;
      const totalCost = calculateCost();

      const { data: orderData, error } = await supabase
        .from("print_orders")
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_name: file.name,
          total_pages: totalPages * copies,
          bw_pages: bwPages * copies,
          colored_pages: coloredPages * copies,
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

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
          <button onClick={() => navigate("/")} className="p-1.5">
            <Printer className="h-5 w-5 text-primary" />
          </button>
          <span className="font-bold text-sm ml-2">Order Confirmed</span>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold mb-3">Print Order Placed!</h2>
          <p className="text-sm text-muted-foreground mb-2">Your print request #{orderId?.slice(0, 8)} has been received.</p>
          <p className="text-sm text-muted-foreground mb-8">We'll notify you when it's ready for {deliveryType}.</p>
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <Printer className="h-5 w-5 text-primary" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-primary">Print Service</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* File Upload */}
        <div className="bg-card rounded-xl border border-border p-4">
          <Label className="text-sm font-bold flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" /> Upload Document
          </Label>
          
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Tap to upload PDF</p>
              <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={removeFile} className="p-1 hover:bg-muted rounded-full">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Print Settings */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <Label className="text-sm font-bold flex items-center gap-2">
            <Printer className="h-4 w-4 text-primary" /> Print Settings
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px]">Page Size</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <button
                  onClick={() => setPageSize("short")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    pageSize === "short" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  Short
                </button>
                <button
                  onClick={() => setPageSize("long")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    pageSize === "long" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  Long
                </button>
              </div>
            </div>

            <div>
              <Label className="text-[10px]">Color Mode</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <button
                  onClick={() => setColorMode("bw")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    colorMode === "bw" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  B&W
                </button>
                <button
                  onClick={() => setColorMode("color")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    colorMode === "color" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  Color
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-[10px]">Total Pages</Label>
            <Input
              type="number"
              min="1"
              value={totalPages}
              onChange={(e) => setTotalPages(Math.max(1, Number(e.target.value)))}
              className="text-sm h-9 mt-1"
            />
          </div>

          <div>
            <Label className="text-[10px]">Copies</Label>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
              >
                -
              </button>
              <span className="text-sm font-bold w-8 text-center">{copies}</span>
              <button
                onClick={() => setCopies(copies + 1)}
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <Label className="text-sm font-bold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Delivery
          </Label>
          
          <div>
            <Label className="text-[10px]">Type</Label>
            <div className="grid grid-cols-2 gap-1 mt-1">
              <button
                onClick={() => setDeliveryType("pickup")}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  deliveryType === "pickup" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Pickup
              </button>
              <button
                onClick={() => setDeliveryType("delivery")}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  deliveryType === "delivery" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                Delivery (+₱50)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px]">Date</Label>
              <Input
                type="date"
                min={today}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="text-sm h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px]">Time</Label>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              >
                <option value="">Select</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-bold mb-3">Cost Summary</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pages ({totalPages} × {copies} copies)</span>
              <span className="font-bold">₱{(totalPages * (pageSize === "short" ? 5 : 8) * (colorMode === "color" ? 2 : 1) * copies).toFixed(2)}</span>
            </div>
            {deliveryType === "delivery" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-bold">₱50.00</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-extrabold text-primary text-base">₱{calculateCost().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !file || !pickupDate || !pickupTime}
          className="w-full h-12 font-bold rounded-xl"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitting ? "Submitting..." : "Submit Print Order"}
        </Button>
      </div>
    </div>
  );
}