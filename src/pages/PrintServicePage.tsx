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
import { Upload, FileText, Printer, MapPin, CheckCircle2, X, Loader2, Palette, File } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { notifyAdminNewPrintOrder } from "@/lib/notifications";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageInfo {
  pageNum: number;
  isColor: boolean;
  selected: boolean;
}

export default function PrintServicePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableFontFace: true, useSystemFonts: true }).promise;
      const analyzedPages: PageInfo[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width; canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, canvas: canvas, viewport } as any).promise;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let isColor = false;
        for (let j = 0; j < imageData.data.length; j += 16) {
          if (Math.abs(imageData.data[j] - imageData.data[j+1]) > 15 || Math.abs(imageData.data[j] - imageData.data[j+2]) > 15) {
            isColor = true; break;
          }
        }
        analyzedPages.push({ pageNum: i, isColor, selected: true });
      }
      setPages(analyzedPages);
    } catch (err) {
      toast.error("Failed to analyze PDF. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const calculateCost = () => {
    const selectedPages = pages.filter(p => p.selected);
    let pageCost = 0;
    for (const p of selectedPages) {
      if (pageSize === "short") pageCost += p.isColor ? 5 : 3;
      else pageCost += p.isColor ? 10 : 8;
    }
    return (pageCost * copies) + (deliveryType === "delivery" ? 10 : 0);
  };

  const handleSubmit = async () => {
    if (!user || !file || pages.length === 0 || !pickupDate || !pickupTime) return;
    setSubmitting(true);
    try {
      const fileName = `${user.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage.from("print-orders").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("print-orders").getPublicUrl(fileName);
      const totalCost = calculateCost();

      const { data: orderData, error } = await supabase.from("print_orders").insert({
        user_id: user.id, file_url: publicUrl, file_name: file.name,
        total_pages: pages.filter(p => p.selected).length * copies,
        bw_pages: pages.filter(p => p.selected && !p.isColor).length * copies,
        colored_pages: pages.filter(p => p.selected && p.isColor).length * copies,
        page_size: pageSize, delivery_type: deliveryType, pickup_date: pickupDate,
        pickup_time: pickupTime, cost: totalCost, status: "pending",
      } as any).select().single();

      if (error) throw error;
      setOrderId((orderData as any).id);
      setOrderComplete(true);
      
      const userName = profile ? `${profile.first_name} ${profile.last_name}` : "A student";
      await notifyAdminNewPrintOrder(userName, totalCost);
      toast.success("Print order submitted!");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
          <button onClick={() => navigate("/")} className="p-1.5"><Printer className="h-5 w-5" /></button>
          <span className="font-bold text-sm ml-2">Order Confirmed</span>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="h-10 w-10 text-green-600" /></div>
          <h2 className="text-2xl font-extrabold mb-3">Print Order Placed!</h2>
          <p className="text-sm text-muted-foreground mb-8">Your print request #{orderId?.slice(0, 8)} has been received.</p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/orders")} className="w-full h-12 font-bold rounded-xl">View Orders</Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12 font-bold rounded-xl">Continue Shopping</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5"><Printer className="h-5 w-5 text-primary" /></button>
        <div className="flex-1 text-center"><h1 className="text-lg font-bold text-primary">Print Service</h1></div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <Label className="text-sm font-bold flex items-center gap-2 mb-3"><FileText className="h-4 w-4 text-primary" /> Upload Document</Label>
          {!file ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50"><Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm font-medium">Tap to upload PDF</p></div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0"><FileText className="h-5 w-5 text-primary shrink-0" /><p className="text-xs font-bold truncate">{file.name}</p></div>
              <button onClick={() => { setFile(null); setPages([]); }} className="p-1"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); analyzePdf(f); } }} />
        </div>
        {pages.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between"><Label className="text-sm font-bold">Select Pages</Label></div>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {pages.map(p => (
                <button key={p.pageNum} onClick={() => setPages(pages.map(pg => pg.pageNum === p.pageNum ? { ...pg, selected: !pg.selected } : pg))} className={`p-2 rounded-lg border text-xs font-bold ${p.selected ? "border-primary bg-primary/10" : "opacity-60"}`}>{p.pageNum}</button>
              ))}
            </div>
          </div>
        )}
        <Button onClick={handleSubmit} disabled={submitting || !file || pages.length === 0 || noTimesToday} className="w-full h-12 font-bold rounded-xl">{submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Print Order"}</Button>
      </div>
    </div>
  );
}