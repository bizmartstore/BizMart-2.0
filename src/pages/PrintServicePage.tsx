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
  MapPin, Truck, Loader2, ChevronDown, ChevronUp, Eye, Trash2,
  Info, HelpCircle, ShieldCheck, Zap, AlertCircle
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker with a reliable CDN
// Using unpkg which is more reliable for PDF.js worker files
const PDFJS_VERSION = (pdfjsLib as any).version || '5.6.207';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;

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
      // Use pdfjsLib directly with proper worker configuration
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Create a new PDF document
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
      <div className="px-3 mt-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <Printer className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-extrabold text-xl text-foreground">Campus Print Service</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload, configure, and print your documents in minutes</p>
        </div>

        {!storeOpen && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-6 flex items-center gap-2">
            <Info className="h-4 w-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive font-medium">Store is currently closed. Requests will be processed when we reopen.</p>
          </div>
        )}

        {/* Step 1: Upload */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            <h2 className="font-bold text-sm">Upload Document</h2>
          </div>
          
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelect} className="hidden" />
          
          {!file ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-muted/50 hover:border-primary/50 transition-all group"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              )}
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{uploading ? "Uploading..." : "Tap to upload PDF"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Max 50MB • PDF format only</p>
              </div>
            </button>
          ) : (
            <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-between border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate text-foreground">{fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {analyzing ? "Analyzing pages..." : `${pages.length} pages detected`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {analyzing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                <button onClick={removeFile} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {pdfError && (
            <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{pdfError}</p>
            </div>
          )}
        </div>

        {/* Step 2: Configure */}
        {pages.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {/* Page Analysis */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <h2 className="font-bold text-sm">Configure Print</h2>
                </div>
                <button onClick={() => setShowPageSelector(!showPageSelector)} className="text-xs text-primary font-bold flex items-center gap-1">
                  {showPageSelector ? "Hide Pages" : "Select Pages"}
                  {showPageSelector ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted/30 rounded-xl p-3 text-center border border-border">
                  <p className="text-xl font-extrabold text-foreground">{pages.length}</p>
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Total</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center border border-border">
                  <p className="text-xl font-extrabold text-muted-foreground">{pages.filter(p => !p.isColor).length}</p>
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">B&W</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center border border-border">
                  <p className="text-xl font-extrabold text-primary">{pages.filter(p => p.isColor).length}</p>
                  <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Color</p>
                </div>
              </div>

              {showPageSelector && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={selectAll} className="flex-1 text-[10px] h-8">Select All</Button>
                    <Button size="sm" variant="outline" onClick={deselectAll} className="flex-1 text-[10px] h-8">Deselect All</Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {pages.map(page => (
                      <button
                        key={page.pageNumber}
                        onClick={() => togglePage(page.pageNumber)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all ${
                          page.selected ? "bg-primary/10 border border-primary/30" : "bg-muted/30 border border-border opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${page.selected ? "bg-primary border-primary" : "border-border"}`}>
                            {page.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className="font-bold">Page {page.pageNumber}</span>
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

            {/* Options */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
              <div>
                <Label className="text-xs font-bold mb-2 block flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-primary" /> Paper Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["short", "long"] as PaperSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => setPaperSize(size)}
                      className={`p-3 rounded-xl border text-center transition-all ${paperSize === size ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-border bg-muted/30 hover:bg-muted/50"}`}
                    >
                      <p className="font-bold text-sm capitalize">{size === "short" ? "Short / A4" : "Long / Legal"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">B&W ₱{PRICING[size].bw} · Color ₱{PRICING[size].color}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold mb-2 block flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-primary" /> Delivery Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pickup", "delivery"] as DeliveryType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setDeliveryType(type)}
                      className={`p-3 rounded-xl border text-center transition-all ${deliveryType === type ? "border-primary bg-primary/10 ring-1 ring-primary/20" : "border-border bg-muted/30 hover:bg-muted/50"}`}
                    >
                      {type === "pickup" ? <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" /> : <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />}
                      <span className="text-xs font-bold capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> Pickup Date</Label>
                  <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="text-xs h-9" />
                </div>
                <div>
                  <Label className="text-[10px] flex items-center gap-1 mb-1"><Clock className="h-3 w-3" /> Pickup Time</Label>
                  <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="text-xs h-9" />
                </div>
              </div>
            </div>

            {/* Pricing Guide */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Pricing Guide</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-bold text-muted-foreground">Size</th>
                      <th className="text-center py-2 font-bold text-muted-foreground">B&W</th>
                      <th className="text-center py-2 font-bold text-muted-foreground">Color</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium">Short / A4</td>
                      <td className="text-center py-2">₱3.00</td>
                      <td className="text-center py-2">₱8.00</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Long / Legal</td>
                      <td className="text-center py-2">₱5.00</td>
                      <td className="text-center py-2">₱10.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {deliveryType === "delivery" && (
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1"><Info className="h-3 w-3" /> Delivery fee: ₱{gcashFee}</p>
              )}
            </div>

            {/* Summary & Submit */}
            <div className="bg-gradient-to-br from-primary/5 to-accent rounded-2xl p-5 border border-primary/20 shadow-sm">
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
                <div className="flex justify-between pt-2 border-t border-primary/20">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-extrabold text-primary text-lg">₱{totalCost.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={submitting || !storeOpen || selectedPages.length === 0} className="w-full h-12 font-bold rounded-xl text-base shadow-lg shadow-primary/20">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Zap className="h-5 w-5 mr-2" />}
                {submitting ? "Submitting..." : `Submit Print Request`}
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-muted/30 rounded-2xl p-4 border border-border">
              <h4 className="font-bold text-xs mb-2 flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5 text-primary" /> Quick Tips</h4>
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