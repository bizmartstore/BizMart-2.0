import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, AlertCircle, Download, Trash2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

export default function PrintServicePage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [bwPages, setBwPages] = useState<number[]>([]);
  const [coloredPages, setColoredPages] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState<"short" | "long">("short");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("print_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setOrders(data || []);
  };

  const analyzePdf = async (file: File) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const total = pdf.numPages;
      setTotalPages(total);

      const pageList = [];
      for (let i = 1; i <= total; i++) {
        pageList.push({ num: i, bw: false, color: true });
      }
      setPages(pageList);
    } catch (e: any) {
      console.error("PDF analysis failed:", e);
      toast.error("Failed to read PDF. Please try another file.");
      setFile(null);
      setPages([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type
    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    // Validate file size (50MB max)
    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    // Validate filename (no special characters that could be used for path traversal)
    const filename = selected.name;
    if (/[<>:"/\\|?*]/.test(filename)) {
      toast.error("Filename contains invalid characters");
      return;
    }

    setFile(selected);
    setPages([]);
    await analyzePdf(selected);
  };

  const togglePageColor = (pageNum: number) => {
    setPages(prev => prev.map(p => {
      if (p.num === pageNum) {
        return { ...p, bw: !p.bw, color: !p.bw };
      }
      return p;
    }));
  };

  const calculateCost = () => {
    const bwCount = pages.filter(p => p.bw).length;
    const colorCount = pages.filter(p => !p.bw).length;
    const bwRate = pageSize === "short" ? 2 : 3;
    const colorRate = pageSize === "short" ? 10 : 15;
    return (bwCount * bwRate) + (colorCount * colorRate);
  };

  const handleSubmit = async () => {
    if (!user || !file || pages.length === 0) return;
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const ext = file.name.split(".").pop();
      const path = `print-orders/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("print-orders").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("print-orders").getPublicUrl(path);

      const bwPages = pages.filter(p => p.bw).map(p => p.num);
      const coloredPages = pages.filter(p => !p.bw).map(p => p.num);
      const cost = calculateCost();

      await (supabase as any).from("print_orders").insert({
        user_id: user.id,
        file_url: publicUrl,
        file_name: file.name,
        total_pages: totalPages,
        bw_pages: bwPages,
        colored_pages: coloredPages,
        page_size: pageSize,
        delivery_type: deliveryType,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        cost,
        status: "pending",
      });

      toast.success("Print order submitted!");
      setFile(null);
      setPages([]);
      setTotalPages(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadOrders();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit print order");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Print Service</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to submit print orders.</p>
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
        <h1 className="font-extrabold text-lg mb-4">Print Service</h1>

        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <h2 className="font-bold text-sm mb-3">Upload Document</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Tap to upload PDF"}</span>
          </button>
          {file && (
            <div className="mt-3 p-3 bg-muted/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => { setFile(null); setPages([]); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-1.5 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {pages.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-4">
            <h2 className="font-bold text-sm mb-3">Select Pages</h2>
            <p className="text-[10px] text-muted-foreground mb-3">Toggle between B&W (₱2-3) and Color (₱10-15) for each page</p>

            <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto">
              {pages.map((page) => (
                <button
                  key={page.num}
                  onClick={() => togglePageColor(page.num)}
                  className={`p-2 rounded-lg text-center border transition-all ${
                    page.bw
                      ? "bg-muted border-border"
                      : "bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300"
                  }`}
                >
                  <p className="text-xs font-bold">{page.num}</p>
                  <p className="text-[8px] text-muted-foreground">{page.bw ? "B&W" : "Color"}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-bold">Paper Size</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as "short" | "long")}
                  className="w-full text-sm h-9 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="short">Short/A4 (₱2 B&W, ₱10 Color)</option>
                  <option value="long">Long 8.5x13 (₱3 B&W, ₱15 Color)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold">Delivery</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as "pickup" | "delivery")}
                  className="w-full text-sm h-9 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="pickup">Pickup (Free)</option>
                  <option value="delivery">Delivery (+₱10)</option>
                </select>
              </div>
            </div>

            {deliveryType === "pickup" ? (
              <>
                <div className="mb-3">
                  <label className="text-xs font-bold">Pickup Date</label>
                  <Input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="text-sm"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold">Pickup Time</label>
                  <Input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="mb-4 p-3 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground">Delivery fee: ₱10.00</p>
                <p className="text-[10px] text-muted-foreground">Pickup will be arranged via chat after approval.</p>
              </div>
            )}

            <div className="bg-muted/30 rounded-xl p-3 mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">B&W Pages</span>
                <span className="text-xs font-bold">{pages.filter(p => p.bw).length} × ₱{pageSize === "short" ? "2" : "3"}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">Color Pages</span>
                <span className="text-xs font-bold">{pages.filter(p => !p.bw).length} × ₱{pageSize === "short" ? "10" : "15"}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between items-center">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-extrabold text-primary">₱{calculateCost().toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={uploading || !pickupDate || !pickupTime} className="w-full h-11 font-bold rounded-xl">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              {uploading ? "Submitting..." : "Submit Print Order"}
            </Button>
          </div>
        )}

        <div className="mt-5">
          <h3 className="font-bold text-sm mb-3">My Print Orders</h3>
          {orders.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-dashed border-border">
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No print orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-foreground truncate">{order.file_name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                      order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                      order.status === 'pending' ? 'bg-warning/20 text-warning' :
                      order.status === 'approved' ? 'bg-primary/20 text-primary' :
                      'bg-destructive/20 text-destructive'
                    }`}>{order.status}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{order.total_pages} pages</span>
                    <span className="font-bold text-primary">₱{Number(order.cost).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}