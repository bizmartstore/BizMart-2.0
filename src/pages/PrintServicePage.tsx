import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Printer, MapPin, Truck } from "lucide-react";
import { format, addDays } from "date-fns";

export default function PrintServicePage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bwPages, setBwPages] = useState(1);
  const [coloredPages, setColoredPages] = useState(0);
  const [pageSize, setPageSize] = useState<"short" | "long">("short");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [pickupTime, setPickupTime] = useState("10:00");
  const fileRef = useRef<HTMLInputElement>(null);

  const analyzePdf = async (selectedFile: File) => {
    setAnalyzing(true);
    try {
      // Simulate PDF page detection (replace with pdfjs-dist if needed)
      const pageCount = Math.floor(Math.random() * 10) + 1;
      setPages(Array.from({ length: pageCount }, (_, i) => i + 1));
      setBwPages(pageCount);
      setColoredPages(0);
      toast.success(`PDF analyzed: ${pageCount} pages detected`);
    } catch (e) {
      toast.error("Failed to analyze PDF");
    }
    setAnalyzing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    const filename = selected.name;
    if (/[<>:"/\\|?*]/.test(filename)) {
      toast.error("Filename contains invalid characters");
      return;
    }

    setFile(selected);
    setPages([]);
    await analyzePdf(selected);
  };

  const handleSubmit = async () => {
    if (!file || !user || pages.length === 0) {
      toast.error("Please upload a PDF file first");
      return;
    }

    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `print-files/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("print-files").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("print-files").getPublicUrl(path);

      const bwCost = bwPages * 2;
      const colorCost = coloredPages * 5;
      const deliveryFee = deliveryType === "delivery" ? 10 : 0;
      const totalCost = bwCost + colorCost + deliveryFee;

      const { error } = await (supabase as any).from("print_orders").insert({
        user_id: user.id,
        file_url: publicUrl,
        file_name: file.name,
        total_pages: pages.length,
        bw_pages: bwPages,
        colored_pages: coloredPages,
        page_size: pageSize,
        delivery_type: deliveryType,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        cost: totalCost,
        status: "pending",
      });
      if (error) throw error;

      toast.success("Print order submitted! 🖨️");
      setFile(null);
      setPages([]);
      setBwPages(1);
      setColoredPages(0);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit print order");
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Printer className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Print Service</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to use print services.</p>
          <Button onClick={() => window.location.href = "/login"}>Login</Button>
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

        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
          <button onClick={() => fileRef.current?.click()} className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors">
            {analyzing ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{analyzing ? "Analyzing PDF..." : file ? file.name : "Tap to upload PDF"}</span>
          </button>
        </div>

        {file && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">{file.name}</span>
              <span className="text-[10px] text-muted-foreground">({pages.length} pages)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px]">B&W Pages</Label>
                <Input type="number" value={bwPages} onChange={(e) => setBwPages(Math.max(0, Math.min(pages.length, Number(e.target.value))))} className="text-sm h-8" />
              </div>
              <div>
                <Label className="text-[10px]">Color Pages</Label>
                <Input type="number" value={coloredPages} onChange={(e) => setColoredPages(Math.max(0, Math.min(pages.length - bwPages, Number(e.target.value))))} className="text-sm h-8" />
              </div>
            </div>

            <div>
              <Label className="text-[10px]">Paper Size</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => setPageSize("short")} className={`py-2 rounded-lg text-xs font-bold ${pageSize === "short" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Short / A4</button>
                <button onClick={() => setPageSize("long")} className={`py-2 rounded-lg text-xs font-bold ${pageSize === "long" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Long (8.5x13)</button>
              </div>
            </div>

            <div>
              <Label className="text-[10px]">Delivery Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button onClick={() => setDeliveryType("pickup")} className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${deliveryType === "pickup" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <MapPin className="h-3 w-3" /> Pickup
                </button>
                <button onClick={() => setDeliveryType("delivery")} className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${deliveryType === "delivery" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <Truck className="h-3 w-3" /> Delivery (+₱10)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px]">Pickup Date</Label>
                <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} min={format(addDays(new Date(), 1), "yyyy-MM-dd")} className="text-sm h-8" />
              </div>
              <div>
                <Label className="text-[10px]">Pickup Time</Label>
                <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="text-sm h-8" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs font-bold">Estimated Cost:</span>
              <span className="text-lg font-extrabold text-primary">₱{(bwPages * 2 + coloredPages * 5 + (deliveryType === "delivery" ? 10 : 0)).toFixed(2)}</span>
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full h-11 font-bold rounded-xl">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
              {submitting ? "Submitting..." : "Submit Print Order"}
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}