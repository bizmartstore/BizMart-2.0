"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Printer, Upload, FileText, Check, Calendar, Clock, 
  MapPin, Truck, Loader2, ChevronDown, ChevronUp,
  AlertCircle, FileCheck, ArrowRight, ArrowLeft, Package, DollarSign
} from "lucide-react";
import { sendNotification } from "@/lib/notifications";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PRICING = {
  short: { bw: 3.00, color: 8.00, label: "Short / A4" },
  long: { bw: 5.00, color: 10.00, label: "Long (8.5x13)" },
};

type PaperSize = "short" | "long";
type DeliveryType = "pickup" | "delivery";

interface PageInfo {
  pageNumber: number;
  isColor: boolean;
  selected: boolean;
}

function isPageColored(imageData: ImageData, threshold = 0.01): boolean {
  const data = imageData.data;
  let coloredPixels = 0;
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (maxDiff > 15) coloredPixels++;
  }
  return (coloredPixels / (data.length / 40)) > threshold;
}

export default function PrintServicePage() {
  const { user, profile } = useAuth();
  const { storeOpen, gcashFee } = useAppSettings();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Calculate minimum time (10 minutes from now) and end of day
  const { minTimeString, endOfDayString, initialTime } = useMemo(() => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 10 * 60000); // 10 minutes from now
    const minTimeString = minTime.toTimeString().slice(0, 5);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const endOfDayString = endOfDay.toTimeString().slice(0, 5);
    return { minTimeString, endOfDayString, initialTime: minTimeString };
  }, []);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>("short");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [pickupTime, setPickupTime] = useState(initialTime);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please upload a PDF file only");
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setPages([]);
    setFileUrl(null);
    setPdfError(null);
    await uploadFile(selectedFile);
  };

  const uploadFile = async (pdfFile: File) => {
    setUploading(true);
    setPdfError(null);
    try {
      const path = `print-files/${user?.id}/${Date.now()}.pdf`;
      const { error } = await supabase.storage.from("print-files").upload(path, pdfFile);
      if (error) throw error;
      const { data } = supabase.storage.from("print-files").getPublicUrl(path);
      setFileUrl(data.publicUrl);
      await analyzePDF(pdfFile);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const analyzePDF = async (pdfFile: File) => {
    setAnalyzing(true);
    setPdfError(null);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true }).promise;
      const numPages = pdf.numPages;
      const pageInfos: PageInfo[] = [];
      const maxPages = Math.min(numPages, 50);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvas, viewport }).promise;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          pageInfos.push({ pageNumber: i, isColor: isPageColored(imageData), selected: true });
        }
      }
      setPages(pageInfos);
      setStep(2);
      toast.success(`PDF analyzed: ${numPages} pages detected`);
    } catch (e: any) {
      console.error("PDF analysis failed:", e);
      setPdfError("Failed to analyze PDF. Please try another file.");
      toast.error("PDF analysis failed");
    }
    setAnalyzing(false);
  };

  const togglePage = (idx: number) => {
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p));
  };

  const selectAll = () => setPages(prev => prev.map((p) => ({ ...p, selected: true })));
  const deselectAll = () => setPages(prev => prev.map((p) => ({ ...p, selected: false })));

  const selectedPages = pages.filter((p) => p.selected);
  const bwPages = selectedPages.filter((p) => !p.isColor).length;
  const colorPages = selectedPages.filter((p) => p.isColor).length;
  const pricing = PRICING[paperSize];
  const subtotal = bwPages * pricing.bw + colorPages * pricing.color;
  const deliveryFee = deliveryType === "delivery" ? gcashFee : 0;
  const totalCost = subtotal + deliveryFee;

  const handleSubmit = async () => {
    if (!user || !file || selectedPages.length === 0) return;
    if (!pickupTime) {
      toast.error("Please select pickup/delivery time");
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
      const { data, error } = await (supabase as any).from("print_orders").insert({
        user_id: user.id,
        file_name: fileName,
        file_url: fileUrl,
        total_pages: pages.length,
        bw_pages: bwPages,
        colored_pages: colorPages,
        page_size: paperSize,
        cost: totalCost,
        maintenance_fee: 0,
        delivery_fee: deliveryFee,
        status: "pending",
        delivery_type: deliveryType,
        pickup_date: today,
        pickup_time: pickupTime,
      }).select().single();

      if (error) throw error;

      const { sendNotification } = await import("@/lib/notifications");
      const customerName = profile ? `${profile.first_name} ${profile.last_name}` : "Customer";
      await sendNotification({
        title: "🖨️ New Print Request",
        message: `${customerName} submitted a print request for ${fileName} (${pages.length} pages, ₱${totalCost.toFixed(2)})`,
        type: "new_print_order",
        targetRole: "admin",
        link: "/admin?tab=print",
        icon: "🖨️",
      });

      toast.success("Print request submitted! Waiting for admin approval.");
      navigate("/orders");
    } catch (e: any) {
      console.error("Print submission error:", e);
      toast.error(e.message || "Failed to submit print request");
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Printer className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Campus Print Service</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to use the print service.</p>
          <Button onClick={() => navigate("/login")}>Login to Continue</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Printer className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-extrabold text-xl text-foreground">Campus Print Service</h1>
          <p className="text-xs text-muted-foreground mt-1">Upload, preview, and print your documents easily</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          {[
            { num: 1, label: "Upload" },
            { num: 2, label: "Pages" },
            { num: 3, label: "Options" },
            { num: 4, label: "Confirm" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  step > s.num ? 'bg-primary border-primary text-primary-foreground' :
                  step === s.num ? 'border-primary text-primary' : 'border-border'
                }`}>
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className="text-[9px] font-bold mt-1">{s.label}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Upload Your PDF
              </h2>
              
              {/* Instructions */}
              <div className="bg-muted/30 rounded-xl p-3 mb-4 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">How it works:</p>
                <div className="space-y-1.5">
                  {[
                    "Upload your PDF document (max 50MB)",
                    "We'll automatically detect B&W vs colored pages",
                    "Choose which pages to print (optional)",
                    "Select paper size & delivery method",
                    "Pay at pickup/delivery or via GCash",
                  ].map((txt, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="text-[11px] text-muted-foreground">{txt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Info */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">Short / A4</p>
                  <p className="text-xs font-bold text-foreground mt-1">B&W: ₱3.00/page</p>
                  <p className="text-xs font-bold text-foreground">Color: ₱8.00/page</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                  <p className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Long (8.5x13)</p>
                  <p className="text-xs font-bold text-foreground mt-1">B&W: ₱5.00/page</p>
                  <p className="text-xs font-bold text-foreground">Color: ₱10.00/page</p>
                </div>
              </div>

              {/* Upload Area */}
              <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || analyzing}
                className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 hover:border-primary/50 transition-all disabled:opacity-50"
              >
                {uploading || analyzing ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Tap to upload PDF</span>
                    <span className="text-[10px] text-muted-foreground">PDF files only, max 50MB</span>
                  </>
                )}
              </button>
              {pdfError && (
                <div className="mt-3 bg-destructive/10 border border-destructive/20 rounded-lg p-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-[10px] text-destructive">{pdfError}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Page Selection */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-primary" /> Page Analysis
                </h2>
                <span className="text-[10px] text-muted-foreground">{pages.length} pages</span>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <p className="text-lg font-extrabold text-foreground">{pages.length}</p>
                  <p className="text-[9px] text-muted-foreground">Total</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                  <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{pages.filter(p => !p.isColor).length}</p>
                  <p className="text-[9px] text-muted-foreground">B&W</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-2 text-center">
                  <p className="text-lg font-extrabold text-purple-600 dark:text-purple-400">{pages.filter(p => p.isColor).length}</p>
                  <p className="text-[9px] text-muted-foreground">Color</p>
                </div>
              </div>

              {/* Page Selector Toggle */}
              <button
                onClick={() => setShowPageSelector(!showPageSelector)}
                className="w-full flex items-center justify-between p-2 bg-muted/30 rounded-lg mb-3"
              >
                <span className="text-[10px] font-bold text-muted-foreground">
                  {showPageSelector ? "Hide" : "Show"} Page Selection ({selectedPages.length} selected)
                </span>
                {showPageSelector ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showPageSelector && (
                <div className="space-y-2 mb-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={selectAll} className="text-[10px] h-7 flex-1">Select All</Button>
                    <Button size="sm" variant="outline" onClick={deselectAll} className="text-[10px] h-7 flex-1">Deselect All</Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {pages.map((p, idx) => (
                      <button
                        key={p.pageNumber}
                        onClick={() => togglePage(idx)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                          p.selected ? 'border-primary bg-primary/5' : 'border-border opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${p.selected ? 'bg-primary border-primary' : 'border-border'}`}>
                            {p.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className="text-xs font-bold">Page {p.pageNumber}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Next <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Options */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Print Options
              </h2>

              {/* Paper Size */}
              <div>
                <Label className="text-xs font-bold mb-2 block">Paper Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(PRICING) as [PaperSize, typeof PRICING.short][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setPaperSize(key)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        paperSize === key ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
                      }`}
                    >
                      <p className="text-xs font-bold text-foreground">{val.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">B&W ₱{val.bw} · Color ₱{val.color}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <Label className="text-xs font-bold mb-2 block">Delivery Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryType("pickup")}
                    className={`p-3 rounded-xl border text-center transition-all ${deliveryType === "pickup" ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
                  >
                    <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <span className="text-xs font-bold">Pickup</span>
                  </button>
                  <button
                    onClick={() => setDeliveryType("delivery")}
                    className={`p-3 rounded-xl border text-center transition-all ${deliveryType === "delivery" ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
                  >
                    <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <span className="text-xs font-bold">Delivery</span>
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] flex items-center gap-1"><Calendar className="h-3 w-3" /> Date (Today Only)</Label>
                  <Input type="date" value={today} disabled className="text-xs h-8 bg-muted/50 cursor-not-allowed" />
                </div>
                <div>
                  <Label className="text-[10px] flex items-center gap-1"><Clock className="h-3 w-3" /> Time (Min 10 min ahead)</Label>
                  <Input 
                    type="time" 
                    value={pickupTime} 
                    min={minTimeString}
                    max={endOfDayString}
                    onChange={(e) => setPickupTime(e.target.value)} 
                    className="text-xs h-8" 
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Next <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Order Summary
              </h2>

              {/* File Info */}
              <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{pages.length} pages total</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Paper Size</span>
                  <span className="font-bold">{PRICING[paperSize].label}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">BCoins Earned</span>
                  <span className="font-bold">+{(totalCost * 0.10).toFixed(1)} 🪙</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-bold">₱{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-extrabold text-primary text-lg">₱{totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                {deliveryType === "delivery" ? <Truck className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                <span className="text-xs font-bold capitalize">{deliveryType}</span>
                <span className="text-[10px] text-muted-foreground">• {today} at {pickupTime}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft className="h-3 w-3 mr-1" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || !storeOpen} className="flex-1">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}