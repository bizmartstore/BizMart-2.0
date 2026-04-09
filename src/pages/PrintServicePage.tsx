"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, FileText, Printer, MapPin, CheckCircle2, X, 
  Loader2, Palette, File, Info, AlertTriangle, Trash2,
  ChevronRight, Clock, Calendar
} from "lucide-react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { triggerLocalPushNotification } from "@/lib/pushNotifications";
import { sendPushNotification } from "@/lib/notifications";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageInfo {
  pageNum: number;
  isColor: boolean;
  selected: boolean;
}

export default function PrintServicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { storeOpen, closeMessage } = useAppSettings();
  
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

  // Manila Timezone Logic
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayManila = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const minTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins buffer
  const minTimeString = minTime.toTimeString().slice(0, 5);

  useEffect(() => {
    setPickupDate(todayManila);
    setPickupTime(minTimeString);
  }, [todayManila, minTimeString]);

  const analyzePdf = async (file: File) => {
    setAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        disableFontFace: true,
        useSystemFonts: true,
      }).promise;
      
      const analyzedPages: PageInfo[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        await page.render({
          canvasContext: ctx,
          canvas: canvas,
          viewport,
        } as any).promise;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let isColor = false;
        
        // Sample pixels to detect color
        for (let j = 0; j < imageData.data.length; j += 16) {
          const r = imageData.data[j];
          const g = imageData.data[j + 1];
          const b = imageData.data[j + 2];
          // If RGB values differ significantly, it's likely color
          if (Math.abs(r - g) > 20 || Math.abs(r - b) > 20 || Math.abs(g - b) > 20) {
            isColor = true;
            break;
          }
        }
        analyzedPages.push({ pageNum: i, isColor, selected: true });
      }
      setPages(analyzedPages);
      toast.success(`Analyzed ${pdf.numPages} pages successfully!`);
    } catch (err) {
      console.error("PDF analysis error:", err);
      toast.error("Failed to analyze PDF. Please try a different file.");
      setFile(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files are supported.");
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50MB limit.");
      return;
    }

    setFile(selected);
    setPages([]);
    await analyzePdf(selected);
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
    if (!file || pages.length === 0) { toast.error("Please upload and analyze a PDF first."); return; }
    
    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error("Please select at least one page to print.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload file to storage
      const fileExt = file.name.split(".").pop();
      const storagePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("print-orders")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("print-orders")
        .getPublicUrl(storagePath);

      // 2. Create order record
      const bwPages = selectedPages.filter(p => !p.isColor).length * copies;
      const coloredPages = selectedPages.filter(p => p.isColor).length * copies;
      const totalCost = calculateCost();

      const { data: orderData, error } = await (supabase as any)
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
        })
        .select()
        .single();

      if (error) throw error;
      
      setOrderId(orderData.id);
      setOrderComplete(true);
      
      // 3. Notifications
      await sendPushNotification(user.id, {
        title: "Print Order Received! 🖨️",
        body: `Your request for "${file.name}" is pending approval.`,
        data: { orderId: orderData.id, link: "/orders" }
      });
      
      triggerLocalPushNotification(
        "Print Order Placed!",
        `Order #${orderData.id.slice(0, 8)} has been submitted.`
      );
      
      toast.success("Print order submitted!");
    } catch (error: any) {
      toast.error("Submission failed: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="px-4 py-12 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Order Confirmed!</h2>
          <p className="text-sm text-muted-foreground mb-8 px-6">
            Your print request <strong>#{orderId?.slice(0, 8)}</strong> has been received. We'll notify you once it's approved.
          </p>
          <div className="space-y-3 max-w-xs mx-auto">
            <Button onClick={() => navigate("/orders")} className="w-full h-12 font-bold rounded-2xl shadow-lg">
              View My Orders
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12 font-bold rounded-2xl">
              Back to Home
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
            <Printer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-foreground">Print Service</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Upload & Print Documents</p>
          </div>
        </div>

        {!storeOpen && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-destructive">Store is Closed</p>
              <p className="text-[10px] text-destructive/80 leading-relaxed">{closeMessage || "We are not accepting print orders at this time."}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <Label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4 block">
              1. Upload Document
            </Label>
            
            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/20 rounded-2xl p-8 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">Tap to select PDF</p>
                <p className="text-[10px] text-muted-foreground mt-1">Maximum file size: 50MB</p>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate text-foreground">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length || "..."} pages
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFile(null); setPages([]); }} 
                  className="p-2 rounded-full hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Page Analysis & Selection */}
          {analyzing && (
            <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-sm">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">Analyzing Document...</p>
              <p className="text-[10px] text-muted-foreground mt-1">Detecting color and black & white pages</p>
            </div>
          )}

          {pages.length > 0 && !analyzing && (
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                  2. Page Selection
                </Label>
                <div className="flex gap-2">
                  <button onClick={() => selectAll(true)} className="text-[10px] font-bold text-primary hover:underline">Select All</button>
                  <span className="text-muted-foreground text-[10px]">|</span>
                  <button onClick={() => selectAll(false)} className="text-[10px] font-bold text-muted-foreground hover:underline">Clear</button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                {pages.map((p) => (
                  <button
                    key={p.pageNum}
                    onClick={() => togglePage(p.pageNum)}
                    className={`relative aspect-[3/4] rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                      p.selected 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border bg-muted/20 opacity-60"
                    }`}
                  >
                    <span className="text-[10px] font-bold">{p.pageNum}</span>
                    {p.isColor ? (
                      <Palette className="h-3 w-3 text-orange-500" />
                    ) : (
                      <File className="h-3 w-3 text-muted-foreground" />
                    )}
                    {p.selected && (
                      <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between bg-muted/30 rounded-xl p-3">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <File className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-bold">{pages.filter(p => p.selected && !p.isColor).length} B&W</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[10px] font-bold">{pages.filter(p => p.selected && p.isColor).length} Color</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-primary">{pages.filter(p => p.selected).length} Total</span>
              </div>
            </div>
          )}

          {/* Print Options */}
          {pages.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-5">
              <Label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground block">
                3. Print Options
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground">Paper Size</Label>
                  <div className="flex bg-muted/50 rounded-xl p-1">
                    <button
                      onClick={() => setPageSize("short")}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${pageSize === "short" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}
                    >
                      Short (A4)
                    </button>
                    <button
                      onClick={() => setPageSize("long")}
                      className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${pageSize === "long" ? "bg-white text-primary shadow-sm" : "text-muted-foreground"}`}
                    >
                      Long (8.5x13)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground">Copies</Label>
                  <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-1">
                    <button 
                      onClick={() => setCopies(Math.max(1, copies - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-primary shadow-sm active:scale-90 transition-transform"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold">{copies}</span>
                    <button 
                      onClick={() => setCopies(copies + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-primary shadow-sm active:scale-90 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground">Delivery Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryType("pickup")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      deliveryType === "pickup" 
                        ? "border-primary bg-primary/5 text-primary font-bold" 
                        : "border-border bg-card text-muted-foreground font-medium"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs">Pickup</span>
                  </button>
                  <button
                    onClick={() => setDeliveryType("delivery")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                      deliveryType === "delivery" 
                        ? "border-primary bg-primary/5 text-primary font-bold" 
                        : "border-border bg-card text-muted-foreground font-medium"
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <span className="text-xs">Delivery (+₱10)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={pickupDate}
                      min={todayManila}
                      max={todayManila}
                      disabled
                      className="pl-9 text-xs h-10 rounded-xl bg-muted/30 border-none opacity-70"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      min={minTimeString}
                      className="pl-9 text-xs h-10 rounded-xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary & Action */}
      {file && pages.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom duration-500">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Cost</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-primary">₱{calculateCost().toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">incl. fees</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Summary</p>
                <p className="text-xs font-bold text-foreground">
                  {pages.filter(p => p.selected).length * copies} Pages • {copies} {copies === 1 ? 'Copy' : 'Copies'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={submitting || !storeOpen || pages.filter(p => p.selected).length === 0}
              className="w-full h-14 rounded-2xl font-black text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting Order...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirm Print Order
                </>
              )}
            </Button>
            
            <p className="text-[9px] text-center text-muted-foreground mt-3 font-medium">
              By confirming, you agree to pay the total amount upon {deliveryType}.
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}