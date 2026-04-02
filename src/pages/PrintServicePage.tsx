import { useState, useRef, useCallback } from "react";
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
  Printer, Upload, FileText, Check, X, Calendar, Clock, 
  MapPin, Truck, Loader2, ChevronDown, ChevronUp, Eye, Trash2 
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const PRICING = {
  short: { bw: 3.00, color: 8.00 },
  long: { bw: 5.00, color: 10.00 },
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
  const totalPixels = imageData.width * imageData.height;
  
  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Check if pixel has significant color (not grayscale)
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (maxDiff > 15) {
      coloredPixels++;
    }
  }
  
  const sampledPixels = data.length / 40;
  return (coloredPixels / sampledPixels) > threshold;
}

export default function PrintServicePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { storeOpen, gcashFee } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>("short");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Set default pickup date/time
  useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split('T')[0]);
    setPickupTime("10:00");
  });

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
    
    // Upload to Supabase storage
    await uploadFile(selectedFile);
  };

  const uploadFile = async (pdfFile: File) => {
    setUploading(true);
    try {
      const ext = "pdf";
      const path = `print-files/${user?.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("print-files").upload(path, pdfFile);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from("print-files").getPublicUrl(path);
      setFileUrl(publicUrl);
      
      // Analyze PDF
      await analyzePDF(pdfFile);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const analyzePDF = async (pdfFile: File) => {
    setAnalyzing(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const pageInfos: PageInfo[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const isColor = isPageColored(imageData);
          pageInfos.push({
            pageNumber: i,
            isColor,
            selected: true,
          });
        }
      }

      setPages(pageInfos);
      toast.success(`PDF analyzed: ${numPages} pages detected`);
    } catch (e: any) {
      console.error("PDF analysis failed:", e);
      toast.error("Failed to analyze PDF. Please try again.");
    }
    setAnalyzing(false);
  };

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => 
      p.pageNumber === pageNum ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAll = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const selectedPages = pages.filter(p => p.selected);
  const bwPages = selectedPages.filter(p => !p.isColor).length;
  const colorPages = selectedPages.filter(p => p.isColor).length;
  const pricing = PRICING[paperSize];
  const bwCost = bwPages * pricing.bw;
  const colorCost = colorPages * pricing.color;
  const deliveryFee = deliveryType === "delivery" ? gcashFee : 0;
  const totalCost = bwCost + colorCost + deliveryFee;

  const handleSubmit = async () => {
    if (!user || !fileUrl || !fileName) {
      toast.error("Please upload a PDF file first");
      return;
    }
    if (selectedPages.length === 0) {
      toast.error("Please select at least one page to print");
      return;
    }
    if (!pickupDate || !pickupTime) {
      toast.error("Please select date and time");
      return;
    }

    const selectedDT = new Date(`${pickupDate}T${pickupTime}`);
    const minDT = new Date();
    minDT.setMinutes(minDT.getMinutes() + 10);
    if (selectedDT < minDT) {
      toast.error("Please select a time at least 10 minutes from now");
      return;
    }

    setSubmitting(true);
    try {
      const customerName = profile ? `${profile.first_name} ${profile.last_name}` : "Customer";
      
      const { error } = await (supabase as any).from("print_orders").insert({
        user_id: user.id,
        file_url: fileUrl,
        file_name: fileName,
        total_pages: selectedPages.length,
        bw_pages: bwPages,
        colored_pages: colorPages,
        page_size: paperSize,
        cost: totalCost,
        status: "pending",
        delivery_type: deliveryType,
        delivery_fee: deliveryFee,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        customer_name: customerName,
        customer_section: profile?.section ?? null,
        customer_grade_level: profile?.grade_level ?? null,
        customer_contact: profile?.email ?? null,
        selected_pages: selectedPages.map(p => p.pageNumber),
      });

      if (error) throw error;

      // Send notification to admin
      const { sendNotification } = await import("@/lib/notifications");
      const typeLabel = deliveryType === "delivery" ? "🚚 Delivery" : "📦 Pickup";
      await sendNotification({
        title: "🖨️ New Print Request",
        message: `${customerName} submitted a print request (${selectedPages.length} pages, ${typeLabel}) for ₱${totalCost.toFixed(2)}`,
        type: "new_print_order",
        targetRole: "admin",
        link: "/admin?tab=print",
        icon: "🖨️",
      });

      toast.success("Print request submitted! Waiting for admin approval.");
      
      // Reset form
      setFile(null);
      setFileName("");
      setFileUrl(null);
      setPages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message || "Failed to submit print request");
    }
    setSubmitting(false);
  };

  const removeFile = () => {
    setFile(null);
    setFileName("");
    setFileUrl(null);
    setPages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Printer className="h-16 w-16 text-primary mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Print Service</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to upload and print your documents.</p>
          <Button onClick={() => navigate("/login")}>Login to Continue</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Printer className="h-6 w-6 text-primary" />
          <h1 className="font-extrabold text-lg">Print Service</h1>
        </div>

        {!storeOpen && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-4">
            <p className="text-xs text-destructive font-semibold text-center">Store is currently closed. You can submit requests but they will be processed when the store opens.</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" /> Upload PDF
          </h2>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!file ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <FileText className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {uploading ? "Uploading..." : "Tap to upload PDF file"}
              </span>
            </button>
          ) : (
            <div className="bg-muted/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {analyzing ? "Analyzing..." : `${pages.length} pages detected`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {analyzing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                <button onClick={removeFile} className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Page Analysis & Selection */}
        {pages.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Page Analysis
              </h2>
              <button
                onClick={() => setShowPageSelector(!showPageSelector)}
                className="text-xs text-primary font-bold flex items-center gap-1"
              >
                {showPageSelector ? "Hide" : "Select Pages"}
                {showPageSelector ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-foreground">{pages.length}</p>
                <p className="text-[9px] text-muted-foreground">Total Pages</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-muted-foreground">{pages.filter(p => !p.isColor).length}</p>
                <p className="text-[9px] text-muted-foreground">B&W Pages</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-lg font-extrabold text-primary">{pages.filter(p => p.isColor).length}</p>
                <p className="text-[9px] text-muted-foreground">Color Pages</p>
              </div>
            </div>

            {showPageSelector && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll} className="flex-1 text-[10px] h-7">Select All</Button>
                  <Button size="sm" variant="outline" onClick={deselectAll} className="flex-1 text-[10px] h-7">Deselect All</Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {pages.map(page => (
                    <button
                      key={page.pageNumber}
                      onClick={() => togglePage(page.pageNumber)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                        page.selected 
                          ? "bg-primary/10 border border-primary/30" 
                          : "bg-muted/30 border border-border opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          page.selected ? "bg-primary border-primary" : "border-border"
                        }`}>
                          {page.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="font-bold">Page {page.pageNumber}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        page.isColor ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {page.isColor ? "Color" : "B&W"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Print Options */}
        {pages.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-4 space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" /> Print Options
            </h2>

            {/* Paper Size */}
            <div>
              <Label className="text-xs font-bold mb-2 block">Paper Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaperSize("short")}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paperSize === "short" ? "border-primary bg-primary/10" : "border-border bg-muted/30"
                  }`}
                >
                  <p className="font-bold text-sm">Short / A4</p>
                  <p className="text-[10px] text-muted-foreground">B&W ₱3.00 · Color ₱8.00</p>
                </button>
                <button
                  onClick={() => setPaperSize("long")}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    paperSize === "long" ? "border-primary bg-primary/10" : "border-border bg-muted/30"
                  }`}
                >
                  <p className="font-bold text-sm">Long</p>
                  <p className="text-[10px] text-muted-foreground">B&W ₱5.00 · Color ₱10.00</p>
                </button>
              </div>
            </div>

            {/* Delivery Method */}
            <div>
              <Label className="text-xs font-bold mb-2 block">Delivery Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    deliveryType === "pickup" ? "border-primary bg-primary/10" : "border-border bg-muted/30"
                  }`}
                >
                  <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <span className="text-xs font-bold">Pickup</span>
                </button>
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    deliveryType === "delivery" ? "border-primary bg-primary/10" : "border-border bg-muted/30"
                  }`}
                >
                  <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <span className="text-xs font-bold">Delivery</span>
                </button>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</Label>
                <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-[10px] flex items-center gap-1"><Clock className="h-3 w-3" /> Time</Label>
                <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="text-xs h-8" />
              </div>
            </div>
          </div>
        )}

        {/* Cost Summary */}
        {selectedPages.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-4">
            <h2 className="font-bold text-sm mb-3">Cost Summary</h2>
            <div className="space-y-2 text-sm">
              {bwPages > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">B&W Pages ({bwPages} × ₱{pricing.bw.toFixed(2)})</span>
                  <span className="font-bold">₱{bwCost.toFixed(2)}</span>
                </div>
              )}
              {colorPages > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color Pages ({colorPages} × ₱{pricing.color.toFixed(2)})</span>
                  <span className="font-bold">₱{colorCost.toFixed(2)}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-bold">₱{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-bold text-foreground">Total</span>
                <span className="font-extrabold text-primary text-lg">₱{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {pages.length > 0 && (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !storeOpen || selectedPages.length === 0}
            className="w-full h-12 font-bold rounded-xl text-base"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {submitting ? "Submitting..." : `Submit Print Request - ₱${totalCost.toFixed(2)}`}
          </Button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}