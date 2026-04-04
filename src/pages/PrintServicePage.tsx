import { useState, useRef, useEffect } from "react";
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
  MapPin, Truck, Loader2, ChevronDown, ChevronUp, AlertCircle,
  Info, HelpCircle, Zap
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker with reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.6.205/pdf.worker.min.js`;

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
  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (maxDiff > 15) coloredPixels++;
  }
  const sampledPixels = data.length / 40;
  return (coloredPixels / sampledPixels) > threshold;
}

export default function PrintServicePage() {
  const { user, profile } = useAuth();
  const { storeOpen, gcashFee } = useAppSettings();
  const navigate = useNavigate();
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
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Set default pickup date/time
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split('T')[0]);
    setPickupTime("10:00");
  }, []);

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
      const ext = "pdf";
      const path = `print-files/${user?.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("print-files").upload(path, pdfFile);
      if (error) {
        if (error.message.includes("bucket") || error.message.includes("not found")) {
          toast.error("Storage bucket not configured. Please contact admin.");
        } else {
          throw error;
        }
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from("print-files").getPublicUrl(path);
      setFileUrl(publicUrl);
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
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useSystemFonts: true,
      }).promise;
      
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
          await page.render({ canvas, viewport }).promise;
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const isColor = isPageColored(imageData);
          pageInfos.push({ pageNumber: i, isColor, selected: true });
        }
      }

      setPages(pageInfos);
      toast.success(`PDF analyzed: ${numPages} pages detected`);
    } catch (e: any) {
      console.error("PDF analysis failed:", e);
      let errorMsg = "Failed to analyze PDF. ";
      if (e.message?.includes("worker") || e.message?.includes("Failed to fetch")) {
        errorMsg += "PDF.js worker failed to load. This might be a network issue. Please try again or contact support.";
      } else if (e.message?.includes("Password")) {
        errorMsg += "The PDF is password protected. Please remove the password and try again.";
      } else if (e.message?.includes("format")) {
        errorMsg += "The file is not a valid PDF. Please upload a proper PDF file.";
      } else {
        errorMsg += "Please try again or contact support if the problem persists.";
      }
      setPdfError(errorMsg);
      toast.error(errorMsg);
    }
    setAnalyzing(false);
  };

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => p.pageNumber === pageNum ? { ...p, selected: !p.selected } : p));
  };

  const selectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
  const deselectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));

  const selectedPages = pages.filter(p => p.selected);
  const bwPages = selectedPages.filter(p => !p.isColor).length;
  const colorPages = selectedPages.filter(p => p.isColor).length;
  const pricing = PRICING[paperSize];
  const bwCost = bwPages * pricing.bw;
  const colorCost = colorPages * pricing.color;
  const deliveryFee = deliveryType === "delivery" ? gcashFee : 0;
  const totalCost = bwCost + colorCost + deliveryFee;

  const handleSubmit = async () => {
    if (!user || !fileUrl || !fileName) { toast.error("Please upload a PDF file first"); return; }
    if (selectedPages.length === 0) { toast.error("Please select at least one page to print"); return; }
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time"); return; }

    const selectedDT = new Date(`${pickupDate}T${pickupTime}`);
    const minDT = new Date();
    minDT.setMinutes(minDT.getMinutes() + 10);
    if (selectedDT < minDT) { toast.error("Please select a time at least 10 minutes from now"); return; }

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
      setFile(null); setFileName(""); setFileUrl(null); setPages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message || "Failed to submit print request");
    }
    setSubmitting(false);
  };

  const removeFile = () => {
    setFile(null); setFileName(""); setFileUrl(null); setPages([]);
    setPdfError(null);
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
        <div className="text-center mb-6">
          <h1 className="font-extrabold text-xl text-foreground">Print Service</h1>
          <p className="text-sm text-muted-foreground">Upload PDF and get it printed</p>
        </div>

        {!storeOpen && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-6 flex items-center gap-2">
            <Info className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive font-medium">Store is currently closed. Requests will be processed when we reopen.</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-4">
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
          
          {!file ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-sm font-bold">{uploading ? "Uploading..." : "Tap to upload PDF"}</p>
                <p className="text-[10px] text-muted-foreground">Max 50MB</p>
              </div>
            </button>
          ) : (
            <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-bold truncate">{fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {analyzing ? "Analyzing..." : `${pages.length} pages`}
                  </p>
                </div>
              </div>
              <button onClick={removeFile} className="p-2 hover:bg-muted rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {pdfError && (
            <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{pdfError}</p>
            </div>
          )}
        </div>

        {/* PDF Analysis Results */}
        {pages.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm">PDF Analysis</h2>
              <button onClick={() => setShowPageSelector(!showPageSelector)} className="text-xs text-primary font-bold">
                {showPageSelector ? "Hide" : "Select Pages"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold">{pages.length}</p>
                <p className="text-[9px] text-muted-foreground">Total Pages</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-muted-foreground">{pages.filter(p => !p.isColor).length}</p>
                <p className="text-[9px] text-muted-foreground">B&W</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-primary">{pages.filter(p => p.isColor).length}</p>
                <p className="text-[9px] text-muted-foreground">Color</p>
              </div>
            </div>

            {showPageSelector && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll} className="flex-1 text-[10px] h-8">Select All</Button>
                  <Button size="sm" variant="outline" onClick={deselectAll} className="flex-1 text-[10px] h-8">Deselect All</Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {pages.map(page => (
                    <button
                      key={page.pageNumber}
                      onClick={() => togglePage(page.pageNumber)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs ${
                        page.selected ? "bg-primary/10 border border-primary/30" : "bg-muted/30 border border-border opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${page.selected ? "bg-primary border-primary" : "border-border"}`}>
                          {page.selected && <Check className="h-3 w-3" />}
                        </div>
                        <span>Page {page.pageNumber}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${page.isColor ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {page.isColor ? "Color" : "B&W"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Options */}
        {pages.length > 0 && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h2 className="font-bold text-sm mb-4">Print Options</h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold mb-2 block">Paper Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["short", "long"] as PaperSize[]).map(size => (
                      <button
                        key={size}
                        onClick={() => setPaperSize(size)}
                        className={`p-3 rounded-xl border text-center ${paperSize === size ? "border-primary bg-primary/10" : "border-border"}`}
                      >
                        <p className="font-bold text-sm capitalize">{size === "short" ? "Short / A4" : "Long / Legal"}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">B&W ₱{PRICING[size].bw} · Color ₱{PRICING[size].color}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold mb-2 block">Delivery Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["pickup", "delivery"] as DeliveryType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setDeliveryType(type)}
                        className={`p-3 rounded-xl border text-center ${deliveryType === type ? "border-primary bg-primary/10" : "border-border"}`}
                      >
                        <span className="text-xs font-bold capitalize">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] mb-1 block">Pickup Date</Label>
                    <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="text-xs h-9" />
                  </div>
                  <div>
                    <Label className="text-[10px] mb-1 block">Pickup Time</Label>
                    <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="text-xs h-9" />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="font-bold text-sm mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                {bwPages > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">B&W Pages ({bwPages})</span>
                    <span className="font-bold">₱{bwCost.toFixed(2)}</span>
                  </div>
                )}
                {colorPages > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color Pages ({colorPages})</span>
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
                  <span className="font-bold">Total</span>
                  <span className="font-extrabold text-primary">₱{totalCost.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !storeOpen || selectedPages.length === 0} className="w-full h-12 font-bold rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                {submitting ? "Submitting..." : "Submit Print Request"}
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-muted/30 rounded-2xl p-4 border border-border">
              <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Quick Tips</h4>
              <ul className="text-[10px] text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>Ensure your PDF is clear and properly formatted before uploading.</li>
                <li>Color pages are automatically detected. You can manually toggle pages on/off.</li>
                <li>Orders are processed within 10-30 minutes during store hours.</li>
                <li>For delivery, please ensure your contact details are up to date in your profile.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}