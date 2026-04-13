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
import { Upload, FileText, Printer, MapPin, CheckCircle2, X, Loader2, Palette, File, CheckSquare, Square, Truck, Crown } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { triggerLocalPushNotification } from "@/lib/pushNotifications";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageInfo {
  pageNum: number;
  isColor: boolean;
  selected: boolean;
}

export default function PrintServicePage() {
  const navigate = useNavigate();
  const { user, membership } = useAuth();
  const { storeOpen } = useAppSettings();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [copies, setCopies] = useState(1);
  const [pageSize, setPageSize] = useState<"short" | "a4" | "long">("a4");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayManila = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const minTime = new Date(now.getTime() + 10 * 60 * 1000);
  const minTimeString = minTime.toTimeString().slice(0, 5);
  const noTimesToday = minTime.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) !== todayManila;

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  useEffect(() => {
    setPickupDate(todayManila);
    setPickupTime(minTimeString);
  }, [todayManila, minTimeString]);

  const analyzePdf = async (file: File) => {
    setAnalyzing(true);
    setAnalysisProgress(0);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        disableFontFace: true,
        useSystemFonts: true,
      }).promise;
      const analyzedPages: PageInfo[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        setAnalysisProgress(Math.round((i / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) continue;

        await page.render({
          canvasContext: ctx,
          canvas: canvas,
          viewport,
        } as any).promise;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let isColor = false;
        for (let j = 0; j < imageData.data.length; j += 32) {
          const r = imageData.data[j];
          const g = imageData.data[j + 1];
          const b = imageData.data[j + 2];
          if (Math.abs(r - g) > 20 || Math.abs(r - b) > 20 || Math.abs(g - b) > 20) {
            isColor = true;
            break;
          }
        }
        analyzedPages.push({ pageNum: i, isColor, selected: true });
      }
      setPages(analyzedPages);
    } catch (err) {
      console.error("PDF analysis error:", err);
      toast.error("Failed to analyze PDF.");
      removeFile();
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
    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }
    setFile(selected);
    setPages([]);
    await analyzePdf(selected);
  };

  const removeFile = () => {
    setFile(null);
    setPages([]);
    setAnalysisProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => p.pageNum === pageNum ? { ...p, selected: !p.selected } : p));
  };

  const selectAll = (select: boolean) => {
    setPages(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const selectByType = (isColor: boolean) => {
    setPages(prev => prev.map(p => p.isColor === isColor ? { ...p, selected: true } : p));
  };

  const getPrice = (isColor: boolean, size: "short" | "a4" | "long") => {
    if (size === "short" || size === "a4") return isColor ? 5 : 3;
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
    if (!membership) { navigate("/club"); return; }
    if (!storeOpen) { toast.error("Store is currently closed."); return; }
    if (!file) { toast.error("Please upload a PDF file"); return; }
    if (pages.length === 0) { toast.error("PDF analysis incomplete"); return; }

    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error("Please select at least one page to print");
      return;
    }

    if (pickupDate !== todayManila) {
      toast.error("Pickup date must be today.");
      return;
    }

    if (noTimesToday) {
      toast.error("No available times for today.");
      return;
    }

    const selectedMinutes = timeToMinutes(pickupTime);
    const minMinutes = timeToMinutes(minTimeString);
    if (selectedMinutes < minMinutes) {
      toast.error(`Pickup time must be at least 10 minutes from now.`);
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("print-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("print-files")
        .getPublicUrl(fileName);

      // Calculate page counts by size and color
      const shortPages = pageSize === "short" ? selectedPages.length * copies : 0;
      const a4Pages = pageSize === "a4" ? selectedPages.length * copies : 0;
      const longPages = pageSize === "long" ? selectedPages.length * copies : 0;

      const bwPages = selectedPages.filter(p => !p.isColor).length * copies;
      const coloredPages = selectedPages.filter(p => p.isColor).length * copies;
      const totalCost = calculateCost();

      // Extract the actual page numbers that were selected
      // Extract the actual page numbers that were selected
const handleSubmit = async () => {
  try {
    setSubmitting(true);

    if (!user) throw new Error("User not logged in");
    if (!file) throw new Error("No file selected");

    // ==============================
    // ✅ UPLOAD FILE
    // ==============================
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("print-files")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("print-files")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // ==============================
    // ✅ SELECTED PAGES
    // ==============================
    const selectedPageNumbers = selectedPages.map((p: any) => p.pageNum);

    const selectedPagesJSON = JSON.parse(
      JSON.stringify(selectedPageNumbers)
    );

    console.log("Saving selected_pages:", selectedPagesJSON);

    // ==============================
    // ✅ INSERT ORDER
    // ==============================
    const { data: orderData, error } = await supabase
      .from("print_orders")
      .insert([
        {
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
          short_pages: shortPages,
          a4_pages: a4Pages,
          long_pages: longPages,
          selected_pages: selectedPagesJSON,
        },
      ] as any)
      .select()
      .single();

    if (error) throw error;

    // ==============================
    // ✅ SUCCESS
    // ==============================
    if (orderData) {
      setOrderId(orderData.id);
      setOrderComplete(true);

      triggerLocalPushNotification(
        "Print Order Placed! 🖨️",
        `Your print request for "${file.name}" has been received.`
      );

      toast.success("Print order submitted successfully!");
    }
  } catch (error: any) {
    console.error("Submit error:", error);
    toast.error("Failed to submit order: " + error.message);
  } finally {
    setSubmitting(false);
  }
};

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Printer className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Print Service</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access the print service.</p>
          <Button onClick={() => navigate("/login")}>Login to Continue</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Crown className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-extrabold text-xl mb-2">Club Membership Required</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            The Print Service is exclusive to <strong className="text-foreground">BizMart Club Members</strong>. Join the club to unlock document printing!
          </p>
          <Button onClick={() => navigate("/club")} className="w-full max-w-xs h-12 font-bold rounded-xl shadow-lg">
            Join BizMart Club Now
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
          <button onClick={() => navigate("/")} className="p-1.5"><Printer className="h-5 w-5" /></button>
          <span className="font-bold text-sm ml-2">Order Confirmed</span>
        </div>
        <div className="px-4 py-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold mb-3">Print Order Received!</h2>
          <p className="text-sm text-muted-foreground mb-8">Your order #{orderId?.slice(0, 8)} is being processed. We'll notify you when it's ready.</p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/orders")} className="w-full h-12 font-bold rounded-xl">View My Orders</Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12 font-bold rounded-xl">Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedPages = pages.filter(p => p.selected);
  const shortCount = pageSize === "short" ? selectedPages.length : 0;
  const a4Count = pageSize === "a4" ? selectedPages.length : 0;
  const longCount = pageSize === "long" ? selectedPages.length : 0;

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
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Tap to upload PDF</p>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Max 50MB • PDF Only</p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length || '...'} pages</p>
                </div>
              </div>
              <button onClick={removeFile} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Page Selection */}
        {(analyzing || pages.length > 0) && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" /> Select Pages
              </Label>
              {!analyzing && (
                <div className="flex gap-2">
                  <button onClick={() => selectAll(true)} className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">All</button>
                  <button onClick={() => selectAll(false)} className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">None</button>
                </div>
              )}
            </div>
            {analyzing ? (
              <div className="py-8 text-center space-y-3">
                <div className="relative w-16 h-16 mx-auto">
                  <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{analysisProgress}%</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-muted-foreground">Analyzing document colors...</p>
              </div>
            ) : (
              <>
                {/* Select by Color Type */}
                <div className="flex gap-2 mb-2">
                  <button onClick={() => selectByType(false)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-[10px] font-bold hover:bg-muted transition-colors">
                    <File className="h-3 w-3 text-gray-500" /> Select All B&W
                  </button>
                  <button onClick={() => selectByType(true)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-[10px] font-bold hover:bg-muted transition-colors">
                    <Palette className="h-3 w-3 text-orange-500" /> Select All Color
                  </button>
                </div>

                {/* Page Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {pages.map((page) => (
                    <div key={page.pageNum} className="space-y-1">
                      <button
                        onClick={() => togglePage(page.pageNum)}
                        className={`relative p-2 rounded-xl border-2 text-center transition-all w-full ${page.selected ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/30 opacity-60"}`}
                      >
                        <span className="text-[10px] font-extrabold block mb-1">#{page.pageNum}</span>
                        <div className="flex items-center justify-center">
                          {page.isColor ? <Palette className="h-4 w-4 text-orange-500" /> : <File className="h-4 w-4 text-gray-400" />}
                        </div>
                        {page.selected && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Print Settings - Global Paper Size */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <Label className="text-sm font-bold flex items-center gap-2"><Printer className="h-4 w-4 text-primary" /> Print Settings</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Paper Size</Label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setPageSize("short")}
                  className={`py-2 rounded-lg text-[10px] font-bold transition-all ${pageSize === "short" ? "bg-blue-500 text-white shadow-md" : "bg-muted text-muted-foreground"}`}
                >
                  Short
                </button>
                <button
                  onClick={() => setPageSize("a4")}
                  className={`py-2 rounded-lg text-[10px] font-bold transition-all ${pageSize === "a4" ? "bg-green-500 text-white shadow-md" : "bg-muted text-muted-foreground"}`}
                >
                  A4
                </button>
                <button
                  onClick={() => setPageSize("long")}
                  className={`py-2 rounded-lg text-[10px] font-bold transition-all ${pageSize === "long" ? "bg-red-500 text-white shadow-md" : "bg-muted text-muted-foreground"}`}
                >
                  Long
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Copies</Label>
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-1">
                <button
                  onClick={() => setCopies(Math.max(1, copies - 1))}
                  className="h-7 w-7 rounded-md bg-card flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                  -
                </button>
                <span className="text-xs font-extrabold w-6 text-center">{copies}</span>
                <button
                  onClick={() => setCopies(copies + 1)}
                  className="h-7 w-7 rounded-md bg-card flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery & Schedule */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <Label className="text-sm font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Delivery & Schedule</Label>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeliveryType("pickup")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryType === "pickup" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
              >
                <MapPin className="h-3.5 w-3.5" /> Pickup
              </button>
              <button
                onClick={() => setDeliveryType("delivery")}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryType === "delivery" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
              >
                <Truck className="h-3.5 w-3.5" /> Delivery (+₱10)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Date</Label>
              <Input
                type="date"
                value={pickupDate}
                min={todayManila}
                max={todayManila}
                disabled
                className="text-xs h-9 opacity-80 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Time</Label>
              <Input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                min={noTimesToday ? undefined : minTimeString}
                disabled={noTimesToday}
                className="text-xs h-9 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Cost Summary - Shows only selected paper size */}
        <div className="bg-primary/5 rounded-xl border border-primary/10 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Cost Summary</h3>
          <div className="space-y-2">
            {pageSize === "short" && shortCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Short Pages ({shortCount} × {copies})</span>
                <span className="text-xs font-bold">₱{getPrice(false, "short") * shortCount * copies}</span>
              </div>
            )}
            {pageSize === "a4" && a4Count > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">A4 Pages ({a4Count} × {copies})</span>
                <span className="text-xs font-bold">₱{getPrice(false, "a4") * a4Count * copies}</span>
              </div>
            )}
            {pageSize === "long" && longCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Long Pages ({longCount} × {copies})</span>
                <span className="text-xs font-bold">₱{getPrice(false, "long") * longCount * copies}</span>
              </div>
            )}
            <div className="border-t border-primary/10 pt-2 flex justify-between items-center">
              <span className="font-extrabold text-xs">TOTAL COST</span>
              <span className="font-black text-primary text-lg">₱{calculateCost().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !file || pages.length === 0 || selectedPages.length === 0 || !pickupDate || !pickupTime || noTimesToday}
          className="w-full h-14 font-black text-base rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Printer className="h-5 w-5 mr-2" />}
          {submitting ? "SUBMITTING..." : "SUBMIT PRINT ORDER"}
        </Button>
      </div>
    </div>
  );
}