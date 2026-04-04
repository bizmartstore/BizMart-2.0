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
import { Upload, FileText, Printer, MapPin, CheckCircle2, X, Loader2, Palette, File } from "lucide-react";
import { format } from "date-fns";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

// Configure PDF.js worker to use the locally bundled worker
// Vite will automatically copy this to /dist/assets/ and cache it via PWA
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageInfo {
  pageNum: number;
  isColor: boolean;
  selected: boolean;
}

export default function PrintServicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { storeOpen } = useAppSettings();
  
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [copies, setCopies] = useState(1);
  const [pageSize, setPageSize] = useState<"short" | "long">("short");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
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

  const analyzePdf = async (file: File) => {
    setAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const analyzedPages: PageInfo[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        let isColor = false;
        for (let j = 0; j < imageData.data.length; j += 16) {
          const r = imageData.data[j];
          const g = imageData.data[j + 1];
          const b = imageData.data[j + 2];
          if (Math.abs(r - g) > 15 || Math.abs(r - b) > 15 || Math.abs(g - b) > 15) {
            isColor = true;
            break;
          }
        }
        analyzedPages.push({ pageNum: i, isColor, selected: true });
      }
      setPages(analyzedPages);
    } catch (err) {
      console.error("PDF analysis failed:", err);
      toast.error("Failed to analyze PDF. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      toast.error("Please upload a PDF file only");
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      toast.error("File size must be less than 15MB");
      return;
    }

    setFile(selected);
    setPages([]);
    await analyzePdf(selected);
  };

  const removeFile = () => {
    setFile(null);
    setPages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => p.pageNum === pageNum ? { ...p, selected: !p.selected } : p));
  };

  const selectAll = (select: boolean) => {
    setPages(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const getPrice = (isColor: boolean, size: "short" | "long") => {
    if (size === "short") return isColor ? 5 : 3;
    return isColor ? 10 : 8;
  };

  const calculateCost = () => {
    const selectedPages = pages.filter(p => p.selected);
    let pageCost = 0;
    for (const p of selectedPages) {
      pageCost += getPrice(p.isColor, pageSize);
    }
    const deliveryCost = deliveryType === "delivery" ? 10 : 0;
    return (pageCost * copies) + deliveryCost;
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/login"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    if (!file) { toast.error("Please upload a PDF file"); return; }
    if (pages.length === 0) { toast.error("PDF analysis incomplete"); return; }
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

    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error("Please select at least one page to print");
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

      const bwPages = selectedPages.filter(p => !p.isColor).length * copies;
      const coloredPages = selectedPages.filter(p => p.isColor).length * copies;
      const totalCost = calculateCost();

      const { data: orderData, error } = await supabase
        .from("print_orders")
        .insert({
          user_id: user.id,
          file_url: publicUrl,
          file_name: file.name,
          total_pages: selectedPages.length * copies,
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

  const selectedPages = pages.filter(p => p.selected);
  const bwCount = selectedPages.filter(p => !p.isColor).length;
  const colorCount = selectedPages.filter(p => p.isColor).length;

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
              <p className="text-xs text-muted-foreground mt-1">Max 15MB • Auto-analyzes pages</p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length} pages</p>
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

        {/* Page Selection */}
        {pages.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-2">
                <File className="h-4 w-4 text-primary" /> Select Pages
              </Label>
              <div className="flex gap-2">
                <button onClick={() => selectAll(true)} className="text-[10px] font-bold text-primary hover:underline">All</button>
                <button onClick={() => selectAll(false)} className="text-[10px] font-bold text-muted-foreground hover:underline">None</button>
              </div>
            </div>
            
            {analyzing ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                <span className="text-xs text-muted-foreground">Analyzing pages...</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                {pages.map((page) => (
                  <button
                    key={page.pageNum}
                    onClick={() => togglePage(page.pageNum)}
                    className={`relative p-2 rounded-lg border text-center transition-all ${
                      page.selected 
                        ? "border-primary bg-primary/10" 
                        : "border-border bg-muted/30 opacity-60"
                    }`}
                  >
                    <span className="text-xs font-bold block">{page.pageNum}</span>
                    <div className="flex items-center justify-center mt-1">
                      {page.isColor ? (
                        <Palette className="h-3 w-3 text-orange-500" />
                      ) : (
                        <File className="h-3 w-3 text-gray-500" />
                      )}
                    </div>
                    {page.selected && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border">
              <span className="flex items-center gap-1"><File className="h-3 w-3" /> B&W: {bwCount}</span>
              <span className="flex items-center gap-1"><Palette className="h-3 w-3 text-orange-500" /> Color: {colorCount}</span>
              <span className="ml-auto font-bold text-foreground">Selected: {selectedPages.length}/{pages.length}</span>
            </div>
          </div>
        )}

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
                  Short/A4
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
                Delivery (+₱10)
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
            {bwCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">B&W Pages ({bwCount} × {copies})</span>
                <span className="font-bold">₱{(bwCount * getPrice(false, pageSize) * copies).toFixed(2)}</span>
              </div>
            )}
            {colorCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Color Pages ({colorCount} × {copies})</span>
                <span className="font-bold">₱{(colorCount * getPrice(true, pageSize) * copies).toFixed(2)}</span>
              </div>
            )}
            {deliveryType === "delivery" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-bold">₱10.00</span>
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
          disabled={submitting || !file || pages.length === 0 || selectedPages.length === 0 || !pickupDate || !pickupTime}
          className="w-full h-12 font-bold rounded-xl"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitting ? "Submitting..." : "Submit Print Order"}
        </Button>
      </div>
    </div>
  );
}