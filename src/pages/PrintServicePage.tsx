import { useState, useRef, useCallback, useMemo } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Printer, Loader2, Trash2, MapPin, Truck, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notifyAdminNewPrintOrder } from "@/lib/notifications";
import { useQuery } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const PRICING = {
  bw: { short: 3.0, a4: 3.0, long: 5.0 },
  colored: { short: 8.0, a4: 8.0, long: 10.0 },
};

type PageSize = "short" | "a4" | "long";

type PageInfo = {
  pageNumber: number;
  width: number;
  height: number;
  isColored: boolean;
  size: PageSize;
  cost: number;
};

function getMinDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  const dateStr = now.toISOString().slice(0, 10);
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  return { date: dateStr, time: `${hours}:${mins}` };
}

async function detectPageColor(page: any): Promise<boolean> {
  const scale = 0.5;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let colorPixels = 0;
  const sampleStep = 20;
  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min > 30) colorPixels++;
  }
  const totalSampled = Math.floor(data.length / (4 * sampleStep));
  return colorPixels / totalSampled > 0.05;
}

export default function PrintServicePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedSize, setSelectedSize] = useState<PageSize>("short");
  const [rawPages, setRawPages] = useState<{ pageNumber: number; isColored: boolean }[]>([]);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const min = useMemo(() => getMinDateTime(), []);
  const [pickupDate, setPickupDate] = useState(min.date);
  const [pickupTime, setPickupTime] = useState(min.time);

  const deliveryFee = deliveryType === "delivery" ? 5 : 0;
  const grandTotal = totalCost + deliveryFee;

  const { data: myOrders = [] } = useQuery({
    queryKey: ["print-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("print_orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const recalculate = useCallback((raw: { pageNumber: number; isColored: boolean }[], size: PageSize) => {
    const pageInfos: PageInfo[] = raw.map((p) => ({
      ...p,
      width: 0,
      height: 0,
      size,
      cost: p.isColored ? PRICING.colored[size] : PRICING.bw[size],
    }));
    setPages(pageInfos);
    setTotalCost(pageInfos.reduce((sum, p) => sum + p.cost, 0));
  }, []);

  const analyzePdf = useCallback(async (file: File) => {
    setAnalyzing(true);
    setFileName(file.name);
    setPdfFile(file);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const raw: { pageNumber: number; isColored: boolean }[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const isColored = await detectPageColor(page);
        raw.push({ pageNumber: i, isColored });
      }
      setRawPages(raw);
      recalculate(raw, selectedSize);
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze PDF. Please try another file.");
    } finally {
      setAnalyzing(false);
    }
  }, [selectedSize, recalculate]);

  const handleSizeChange = (size: PageSize) => {
    setSelectedSize(size);
    if (rawPages.length > 0) recalculate(rawPages, size);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Please upload a PDF file only."); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("File must be under 20MB."); return; }
    analyzePdf(file);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error("Please login first."); navigate("/login"); return; }
    if (pages.length === 0) return;
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time."); return; }

    // Validate time is at least 10 min ahead
    const selectedDT = new Date(`${pickupDate}T${pickupTime}`);
    const minDT = new Date();
    minDT.setMinutes(minDT.getMinutes() + 10);
    if (selectedDT < minDT) {
      toast.error("Please select a time at least 10 minutes from now.");
      return;
    }

    setSubmitting(true);
    try {
      const bwPages = pages.filter((p) => !p.isColored).length;
      const coloredPages = pages.filter((p) => p.isColored).length;
      const maintenanceFee = Number((totalCost * 0.5).toFixed(2));

      // Upload PDF to storage
      let fileUrl: string | null = null;
      if (pdfFile) {
        const filePath = `${user.id}/${Date.now()}_${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("print-files")
          .upload(filePath, pdfFile, { contentType: "application/pdf" });
        if (uploadError) throw uploadError;
        fileUrl = filePath;
      }

      const { error } = await (supabase as any).from("print_orders").insert({
        user_id: user.id,
        file_name: fileName,
        file_url: fileUrl,
        total_pages: pages.length,
        bw_pages: bwPages,
        colored_pages: coloredPages,
        page_size: selectedSize,
        cost: totalCost,
        maintenance_fee: maintenanceFee,
        status: "pending",
        delivery_type: deliveryType,
        delivery_fee: deliveryFee,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
      });
      if (error) throw error;

      // Notify admins about new print order
      const studentName = profile ? `${profile.first_name} ${profile.last_name}` : "Student";
      notifyAdminNewPrintOrder(studentName, fileName, grandTotal);

      toast.success("Print request submitted! Waiting for admin approval. 🖨️");
      setPages([]); setFileName(""); setPdfFile(null); setTotalCost(0); setRawPages([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit print request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPages([]); setFileName(""); setPdfFile(null); setTotalCost(0); setRawPages([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const bwCount = pages.filter((p) => !p.isColored).length;
  const coloredCount = pages.filter((p) => p.isColored).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🖨️</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-foreground">Print Service</h1>
            <p className="text-xs text-muted-foreground">Upload PDF, choose size, and print!</p>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-4 shadow-sm">
          <h3 className="font-bold text-xs text-secondary uppercase tracking-wide mb-2">📋 Pricing Guide</h3>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-muted rounded-xl p-2.5">
              <span className="font-bold text-foreground block">B&W Short/A4</span>
              <span className="text-primary font-extrabold">₱3.00</span><span className="text-muted-foreground">/page</span>
            </div>
            <div className="bg-muted rounded-xl p-2.5">
              <span className="font-bold text-foreground block">B&W Long</span>
              <span className="text-primary font-extrabold">₱5.00</span><span className="text-muted-foreground">/page</span>
            </div>
            <div className="bg-muted rounded-xl p-2.5">
              <span className="font-bold text-foreground block">Colored Short/A4</span>
              <span className="text-primary font-extrabold">₱8.00</span><span className="text-muted-foreground">/page</span>
            </div>
            <div className="bg-muted rounded-xl p-2.5">
              <span className="font-bold text-foreground block">Colored Long</span>
              <span className="text-primary font-extrabold">₱10.00</span><span className="text-muted-foreground">/page</span>
            </div>
          </div>
        </div>

        {/* Page Size Selection */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-4 shadow-sm">
          <h3 className="font-bold text-xs text-secondary uppercase tracking-wide mb-3">📐 Select Paper Size</h3>
          <RadioGroup value={selectedSize} onValueChange={(v) => handleSizeChange(v as PageSize)} className="flex gap-3">
            {([
              { value: "short", label: "Short Bond", desc: "8.5×11 in" },
              { value: "a4", label: "A4", desc: "210×297 mm" },
              { value: "long", label: "Long Bond", desc: "8.5×13 in" },
            ] as const).map((opt) => (
              <label key={opt.value} className={`flex-1 cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${selectedSize === opt.value ? 'border-primary bg-primary/10' : 'border-border bg-muted/50'}`}>
                <RadioGroupItem value={opt.value} className="sr-only" />
                <span className="font-bold text-xs block text-foreground">{opt.label}</span>
                <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Upload Area */}
        {pages.length === 0 && !analyzing && (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <p className="font-bold text-sm text-foreground">Upload your PDF file</p>
            <p className="text-xs text-muted-foreground text-center">We'll scan pages and detect colors automatically</p>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
          </div>
        )}

        {analyzing && (
          <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="font-bold text-sm text-foreground">Analyzing your PDF...</p>
            <p className="text-xs text-muted-foreground">Scanning pages for color detection</p>
          </div>
        )}

        {pages.length > 0 && !analyzing && (
          <div className="space-y-3">
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold text-sm text-foreground truncate max-w-[200px]">{fileName}</p>
                    <p className="text-[10px] text-muted-foreground">{pages.length} pages • {selectedSize.toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={handleReset} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-muted rounded-xl p-2.5 text-center">
                  <span className="text-lg font-extrabold text-foreground block">{pages.length}</span>
                  <span className="text-[10px] text-muted-foreground">Total</span>
                </div>
                <div className="bg-muted rounded-xl p-2.5 text-center">
                  <span className="text-lg font-extrabold text-foreground block">{bwCount}</span>
                  <span className="text-[10px] text-muted-foreground">B&W</span>
                </div>
                <div className="bg-muted rounded-xl p-2.5 text-center">
                  <span className="text-lg font-extrabold text-foreground block">{coloredCount}</span>
                  <span className="text-[10px] text-muted-foreground">Colored</span>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {pages.map((p) => (
                  <div key={p.pageNumber} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-muted-foreground">Page {p.pageNumber}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isColored ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                        {p.isColored ? "Color" : "B&W"}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">{p.size}</span>
                      <span className="font-bold text-primary">₱{p.cost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery / Pickup Selection */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
              <p className="text-xs font-bold text-foreground">Fulfillment Method</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition-all ${
                    deliveryType === "pickup" ? "border-primary bg-primary/10" : "border-border bg-muted/30"
                  }`}
                >
                  <MapPin className={`h-5 w-5 ${deliveryType === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-bold ${deliveryType === "pickup" ? "text-primary" : "text-muted-foreground"}`}>Pickup</span>
                  <span className="text-[10px] text-muted-foreground">Free</span>
                </button>
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition-all ${
                    deliveryType === "delivery" ? "border-primary bg-primary/10" : "border-border bg-muted/30"
                  }`}
                >
                  <Truck className={`h-5 w-5 ${deliveryType === "delivery" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-bold ${deliveryType === "delivery" ? "text-primary" : "text-muted-foreground"}`}>Delivery</span>
                  <span className="text-[10px] text-primary font-semibold">+₱5.00</span>
                </button>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] font-bold flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" /> Date
                  </Label>
                  <Input
                    type="date"
                    value={pickupDate}
                    min={min.date}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-bold flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" /> Time
                  </Label>
                  <Input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground">⏰ Must be at least 10 minutes from now</p>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/80 text-sm font-bold">Print Cost</span>
                <span className="text-white text-lg font-extrabold">₱{totalCost.toFixed(2)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/70 text-sm">Delivery Fee</span>
                  <span className="text-white text-sm font-bold">+₱{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-bold">Total</span>
                <span className="text-white text-2xl font-extrabold">₱{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-white/70 text-[11px]">50% (₱{(totalCost * 0.5).toFixed(2)}) goes to print service maintenance</span>
              </div>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-[10px]">🪙</span>
                <span className="text-white/70 text-[11px]">Earn +{(totalCost * 0.10).toFixed(1)} BCoins on this order</span>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-white text-purple-600 font-extrabold hover:bg-white/90 rounded-xl">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Printer className="h-4 w-4 mr-2" />Submit Print Request</>}
              </Button>
            </div>
          </div>
        )}

        {myOrders.length > 0 && (
          <div className="mt-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wide text-secondary mb-3">📄 My Print Orders</h3>
            <div className="space-y-2">
              {myOrders.map((order: any) => (
                <div key={order.id} className="bg-card rounded-xl border border-border p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{order.file_name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === "approved" || order.status === "confirmed" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : order.status === "rejected" || order.status === "canceled" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}>{order.status.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>{order.total_pages} pages</span>
                    <span>•</span>
                    <span>{order.page_size?.toUpperCase()}</span>
                    <span>•</span>
                    <span>₱{Number(order.cost).toFixed(2)}</span>
                    {Number(order.delivery_fee) > 0 && (
                      <>
                        <span>•</span>
                        <span>🚚 +₱{Number(order.delivery_fee).toFixed(2)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  {order.pickup_date && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      📅 {order.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}: {order.pickup_date} at {order.pickup_time}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
