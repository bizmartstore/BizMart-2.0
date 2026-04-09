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
import { format } from "date-fns";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { triggerLocalPushNotification } from "@/lib/pushNotifications";
import { sendPushNotification } from "@/lib/notifications";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageInfo {
  pageNum: number;
  isColor: boolean;
  selected: boolean;
}

export default function PrintServicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // 👇 Dynamic current time in Manila timezone
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // en-CA locale guarantees YYYY-MM-DD format required by <input type="date" />
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
        for (let j = 0; j < imageData.data.length; j += 16) {
          const r = imageData.data[j];
          const g = imageData.data[j + 1];
          const b = imageData.data[j + 2];
          if (Math.abs(r - g) > 15 || Math.abs(r - b) > 15 || Math.abs(g - b) > 15) {
            isColor = true;
            break;
          }
        }
        analyzedPages.push({ pageNum: i, isColor, selected: true });
      }
      setPages(analyzedPages);
    } catch (err) {
      console.error("PDF detailed error:", err);
      toast.error("Failed to analyze PDF. Please try again.");
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

    // Increased from 15MB to 50MB
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => p.pageNum === pageNum ? { ...p, selected: !p.selected } : p));
  };

  const selectAll = (select: boolean) => {
    setPages(prev => prev.map(p => ({ ...p, selected: select })));
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
    if (!file) { toast.error("Please upload a PDF file"); return; }
    if (pages.length === 0) { toast.error("PDF analysis incomplete"); return; }
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time"); return; }
    
    if (pickupDate !== todayManila) {
      toast.error("Pickup date must be today.");
      return;
    }

    if (noTimesToday) {
      toast.error("No available times for today. Please choose a different date.");
      return;
    }
    const selectedMinutes = timeToMinutes(pickupTime);
    const minMinutes = timeToMinutes(minTimeString);
    if (selectedMinutes < minMinutes) {
      toast.error(`Pickup time must be at least 10 minutes from now.`);
      return;
    }

    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error("Please select at least one page to print");
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("print-orders")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("print-orders")
        .getPublicUrl(fileName);

      const bwPages = selectedPages.filter(p => !p.isColor).length * copies;
      const coloredPages = selectedPages.filter(p => p.isColor).length * copies;
      const totalCost = calculateCost();

      const { data: orderData, error } = await supabase
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
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      if (orderData) {
        const newOrderId = (orderData as any).id;
        setOrderId(newOrderId);
        setOrderComplete(true);
        
        // Trigger Push Notification
        await sendPushNotification(user.id, {
          title: "Print Order Placed! 🖨️",
          body: `Your print request for "${file.name}" has been received. Please wait for admin approval.`,
          data: {
            orderId: newOrderId,
            status: "pending",
            link: "/orders"
          }
        });
        
        triggerLocalPushNotification(
          "Print Order Placed! 🖨️",
          `Your print request for "${file.name}" has been received. Please wait for admin approval.`
        );
        
        toast.success("Print order submitted successfully!");
      } else {
        throw new Error("No order data returned");
      }
    } catch (error: any) {
      toast.error("Failed to submit order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
          <button onClick={() => navigate("/")} className="p-1.5">
            <Printer className="h-5 w-5 text-primary" />
          </button>
          <span className="font-bold text-sm ml-2">Order Confirmed</span>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold mb-3">Print Order Placed!</h2>
          <p className="text-sm text-muted-foreground mb-2">Your print request #{orderId?.slice(0, 8)} has been received.</p>
          <p className="text-sm text-muted-foreground mb-8">We'll notify you when it's ready for {deliveryType}.</p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/orders")} className="w-full h-12 font-bold rounded-xl">
              View Orders
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12 font-bold rounded-xl">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedPages = pages.filter(p => p.selected);
  const bwCount = selectedPages.filter(p => !p.isColor).length;
  const colorCount = selectedPages.filter(p => p.isColor).length;

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
        <div className="bg-card rounded-xl border border-border p-4">
          <Label className="text-sm font-bold flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" /> Upload Document
          </Label>
          
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Tap to upload PDF</p>
              <p className="text-xs text-muted-foreground mt-1">Max 50MB • Auto-analyzes pages</p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-<dyad-write path="src/components/PrintServicePage.tsx" description="Completing PrintServicePage component with UI for page selection, cost calculation, and submission handling">
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText, Truck, MapPin, User, Search, Eye, Loader2, RefreshCw, AlertCircle, Palette, File } from "lucide-react";
import { triggerLocalPushNotification } from "@/lib/pushNotifications";
import { sendPushNotification } from "@/lib/notifications";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface PageInfo {
  pageNum: number;
  isColor: boolean;
  selected: boolean;
}

export default function PrintServicePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // 👇 Dynamic current time in Manila timezone
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // en-CA locale guarantees YYYY-MM-DD format required by <input type="date" />
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
        for (let j = 0; j < imageData.data.length; j += 16) {
          const r = imageData.data[j];
          const g = imageData.data[j + 1];
          const b = imageData.data[j + 2];
          if (Math.abs(r - g) > 15 || Math.abs(r - b) > 15 || Math.abs(g - b) > 15) {
            isColor = true;
            break;
          }
        }
        analyzedPages.push({ pageNum: i, isColor, selected: true });
      }
      setPages(analyzedPages);
    } catch (err) {
      console.error("PDF detailed error:", err);
      toast.error("Failed to analyze PDF. Please try again.");
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

    // Increased from 15MB to 50MB
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => p.pageNum === pageNum ? { ...p, selected: !p.selected } : p));
  };

  const selectAll = (select: boolean) => {
    setPages(prev => prev.map(p => ({ ...p, selected: select })));
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
    if (!file) { toast.error("Please upload a PDF file"); return; }
    if (pages.length === 0) { toast.error("PDF analysis incomplete"); return; }
    if (!pickupDate || !pickupTime) { toast.error("Please select date and time"); return; }
    
    if (pickupDate !== todayManila) {
      toast.error("Pickup date must be today.");
      return;
    }

    if (noTimesToday) {
      toast.error("No available times for today. Please choose a different date.");
      return;
    }
    const selectedMinutes = timeToMinutes(pickupTime);
    const minMinutes = timeToMinutes(minTimeString);
    if (selectedMinutes < minMinutes) {
      toast.error(`Pickup time must be at least 10 minutes from now.`);
      return;
    }

    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      toast.error("Please select at least one page to print");
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("print-orders")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("print-orders")
        .getPublicUrl(fileName);

      const bwPages = selectedPages.filter(p => !p.isColor).length * copies;
      const coloredPages = selectedPages.filter(p => p.isColor).length * copies;
      const totalCost = calculateCost();

      const { data: orderData, error } = await supabase
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
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      if (orderData) {
        const newOrderId = (orderData as any).id;
        setOrderId(newOrderId);
        setOrderComplete(true);
        
        // Trigger Push Notification        await sendPushNotification(user.id, {
          title: "Print Order Placed! 🖨️",
          body: `Your print request for "${file.name}" has been received. Please wait for admin approval.`,
          data: {
            orderId: newOrderId,
            status: "pending",
            link: "/orders"
          }
        });
        
        triggerLocalPushNotification(
          "Print Order Placed! 🖨️",
          `Your print request for "${file.name}" has been received. Please wait for admin approval.`
        );
        
        toast.success("Print order submitted successfully!");
      } else {
        throw new Error("No order data returned");
      }
    } catch (error: any) {
      toast.error("Failed to submit order: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
          <button onClick={() => navigate("/")} className="p-1.5">
            <Printer className="h-5 w-5 text-primary" />
          </button>
          <span className="font-bold text-sm ml-2">Order Confirmed</span>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold mb-3">Print Order Placed!</h2>
          <p className="text-sm text-muted-foreground mb-2">Your print request #{orderId?.slice(0, 8)} has been received.</p>
          <p className="text-sm text-muted-foreground mb-8">We'll notify you when it's ready for {deliveryType}.</p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/orders")} className="w-full h-12 font-bold rounded-xl">
              View Orders            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full h-12 font-bold rounded-xl">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedPages = pages.filter(p => p.selected);
  const bwCount = selectedPages.filter(p => !p.isColor).length;
  const colorCount = selectedPages.filter(p => p.isColor).length;

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
        <div className="bg-card rounded-xl border border-border p-4">
          <Label className="text-sm font-bold flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" /> Upload Document
          </Label>
          
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-2">Tap to upload PDF</p>
              <p className="text-[10px] text-muted-foreground mt-1">Max 50MB • Auto-analyzes pages</p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length} pages
                  </p>
                </div>
              </div>
              <button onClick={removeFile} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search print orders..." className="pl-9 text-xs h-9" />
        </div>

        {dbError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-destructive">Database Error</p>
              <p className="text-[10px] text-destructive/80 mt-0.5">{dbError}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.map(o => (
              <div key={o.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {o.type === 'print' ? <Printer className="h-4 w-4 text-purple-500 flex-shrink-0" /> : <Package className="h-4 w-4 text-primary flex-shrink-0" />}
                    <span className="font-bold text-xs truncate">
                      {o.type === 'print' ? o.file_name : `Order #${o.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : 'Unknown'} • ₱{Number(o.cost || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : o.status === 'pending' ? 'bg-warning/20 text-warning' : o.status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'`}`}>{o.status}</span>
                  <button onClick={() => setSelectedOrder(o)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Object.entries(statusCounts).map(([key, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                  filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
              </button>
            ))}
            <Button size="sm" variant="outline" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search print orders..." className="pl-9 text-xs h-9" />
        </div>

        {dbError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-destructive">Database Error</p>
              <p className="text-[10px] text-destructive/80 mt-0.5">{dbError}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.map(o => (
              <div key={o.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {o.type === 'print' ? <Printer className="h-4 w-4 text-purple-500 flex-shrink-0" /> : <Package className="h-4 w-4 text-primary flex-shrink-0" />}
                    <span className="font-bold text-xs truncate">
                      {o.type === 'print' ? o.file_name : `Order #${o.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : 'Unknown'} • ₱{Number(o.cost || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : o.status === 'pending' ? 'bg-warning/20 text-warning' : o.status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'`}`}>{o.status}</span>
                  <button onClick={() => setSelectedOrder(o)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Object.entries(statusCounts).map(([key, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                  filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
              </button>
            ))}
            <Button size="sm" variant="outline" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search print orders..." className="pl-9 text-xs h-9" />
        </div>

        {dbError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-destructive">Database Error</p>
              <p className="text-[10px] text-destructive/80 mt-0.5">{dbError}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.map(o => (
              <div key={o.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {o.type === 'print' ? <Printer className="h-4 w-4 text-purple-500 flex-shrink-0" /> : <Package className="h-4 w-4 text-primary flex-shrink-0" />}
                    <span className="font-bold text-xs truncate">
                      {o.type === 'print' ? o.file_name : `Order #${o.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : 'Unknown'} • ₱{Number(o.cost || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : o.status === 'pending' ? 'bg-warning/20 text-warning' : o.status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'`}`}>{o.status}</span>
                  <button onClick={() => setSelectedOrder(o)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Object.entries(statusCounts).map(([key, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                  filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
              </button>
            ))}
            <Button size="sm" variant="outline" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search print orders..." className="pl-9 text-xs h-9" />
        </div>

        {dbError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-destructive">Database Error</p>
              <p className="text-[10px] text-destructive/80 mt-0.5">{dbError}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filtered.map(o => (
              <div key={o.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {o.type === 'print' ? <Printer className="h-4 w-4 text-purple-500 flex-shrink-0" /> : <Package className="h-4 w-4 text-primary flex-shrink-0" />}
                    <span className="font-bold text-xs truncate">
                      {o.type === 'print' ? o.file_name : `Order #${o.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : 'Unknown'} • ₱{Number(o.cost || 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : o.status === 'pending' ? 'bg-warning/20 text-warning' : o.status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'`}`}>{o.status}</span>
                  <button onClick={() => setSelectedOrder(o)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Object.entries(statusCounts).map(([key, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                  filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
              </button>
            ))}
            <Button size="sm" variant="outline" onClick={() => load(true)} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <Label className="text-sm font-bold flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" /> Upload Document
          </Label>
          
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-2">Tap to upload PDF</p>
              <p className="text-[10px] text-muted-foreground mt-1">Max 50MB • Auto-analyzes pages</p>
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length} pages</p>
                </div>
              </div>
              <button onClick={removeFile} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <Label className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Upload Document            </Label>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label className="text-xs font-bold">Category</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. School Supplies" className="text-sm" />
              </div>
              <div>
                <Label className="text-xs font-bold">Products To Sell</Label>
                <Input value={products} onChange={e => setProducts(e.target.value)} placeholder="e.g. Notebooks, Pens" className="text-sm" rows={2} />
              </div>
              <Label className="text-xs font-bold">Experience</Label>
              <Input value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 2 years selling at school fairs" className="text-sm" />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setShowApplication(false)} variant="outline" className="w-full">Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-1">Submit Application</Button>
            </div>
          </div>
        )}

        {application && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm mb-2">Application Status</h3>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${application.status === 'pending' ? 'bg-warning/20 text-warning' : application.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {application.status.toUpperCase()}
              </span>
            </div>
            {application.status === 'pending' && (
              <p className="text-xs text-muted-foreground mb-2">Your application is being reviewed.</p>
            )}
            {application.status === 'approved' && (
              <p className="text-xs text-muted-foreground mb-2">Your application was approved! Visit the store to pay ₱50.00 and get your Seller Code.</p>
            )}
            {application.admin_notes && (
              <p className="text-xs text-muted-foreground mt-1">Admin note: {application.admin_notes}</p>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm mb-2">Application Form</h3>
              <div>
                <Label className="text-xs">Full Name *</Label>
                <Input value={appForm.full_name} onChange={e => setAppForm(e.target.value)} placeholder="Your full name" className="text-sm" />
              </div>
              <Label className="text-xs font-bold">What type of business do you want to run? *</Label>
              <Input value={appForm.business_type} onChange={e => setAppForm(e.target.value)} placeholder="e.g. School Supplies, Snacks, Accessories" className="text-sm" />
            </div>
            <div>
              <Label className="text-xs font-bold">What products will you sell? *</Label>
              <Input value={appForm.products_to_sell} onChange={e => setAppForm(e.target.value)} placeholder="List the products you plan to sell" className="text-sm" rows={2} />
            </div>
            <div>
              <Label className="text-xs font-bold">Why do you want to be a seller? *</Label>
              <Input value={appForm.reason} onChange={e => setAppForm(e.target.value)} placeholder="Tell us your motivation" className="text-sm" rows={2} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowApplication(false)} variant="outline" className="w-full">Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">Submit Application</Button>
            </div>
          </div>

          {application && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Application Status</h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${application.status === 'approved' ? 'bg-green-100 text-green-600' : application.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'`}>
                  {application.status.toUpperCase()}
                </span>
              </div>
              {application.status === 'approved' && (
                <p className="text-xs text-muted-foreground mb-2">
                  🎉 Your application was approved! Visit the store to pay ₱50.00 and get your Seller Code.
                </p>
              )}
              {application.status === 'pending' && (
                <p className="text-xs text-muted-foreground mb-2">
                  ⏳ Your application is being reviewed.
                </p>
              )}
              {application.admin_notes && (
                <p className="text-xs text-muted-foreground mt-1">Admin note: {application.admin_notes}</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm text-foreground">{sellerProfile?.store_name || "Your Store"}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{sellerProfile?.store_name || "Set up your store"}</p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                onClick={() => navigate("/seller-store")}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl px-4 py-2"
              >
                Manage
              </Button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}