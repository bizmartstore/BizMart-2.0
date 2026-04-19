"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Printer, Copy, User, ShoppingCart, Package, CheckCircle2, X, Loader2, Trash2, Plus, Minus, Truck, Home, Clock, AlertCircle, RefreshCw } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Types
type OrderType = 'print' | 'photocopy';
type PageSize = 'short' | 'a4' | 'long';
type DeliveryType = 'pickup' | 'delivery';
type OrderStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'canceled';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  section: string;
  email: string;
}

interface POSOrder {
  id: string;
  user_id: string;
  order_type: OrderType;
  file_url?: string;
  file_name?: string;
  total_pages: number;
  bw_pages: number;
  colored_pages: number;
  page_size: PageSize;
  delivery_type: DeliveryType;
  pickup_date: string;
  pickup_time: string;
  cost: number;
  status: OrderStatus;
  created_at: string;
  customer_name?: string;
  customer_grade?: string;
  customer_section?: string;
}

// Pricing constants
const PRICING = {
  photocopy: {
    short: { bw: 2.0, color: 4.0 },
    a4: { bw: 2.0, color: 4.0 },
    long: { bw: 3.0, color: 7.0 },
  },
  print: {
    short: { bw: 3.0, color: 8.0 },
    a4: { bw: 3.0, color: 8.0 },
    long: { bw: 5.0, color: 10.0 },
  },
  deliveryFee: 10.0,
};

export default function POSContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [now, setNow] = useState(new Date());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<OrderType>('print');
  const [orderType, setOrderType] = useState<OrderType>('print');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(1);
  const [isColor, setIsColor] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerGrade, setCustomerGrade] = useState<string>('');
  const [customerSection, setCustomerSection] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [pages, setPages] = useState<{pageNum: number; isColor: boolean; selected: boolean}[]>([]);

  // Initialize current date/time
  useEffect(() => {
    setNow(new Date());
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

  // Load customers
  const loadCustomers = useCallback(async () => {
    if (adminLoading) return;
    setLoadingCustomers(true);
    try {
      const { data } = await supabase
        .from('profiles' as any)
        .select('id, first_name, last_name, grade_level, section, email')
        .order('last_name');
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  }, [adminLoading]);

  // Load orders
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data } = await supabase
        .from('pos_orders' as any)
        .select('*')
        .order('created_at', { ascending: false });
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (adminLoading) return;
    loadCustomers();
    loadOrders();
  }, [adminLoading, loadCustomers, loadOrders]);

  // Real-time updates for orders
  useEffect(() => {
    if (adminLoading) return;
    const channel = supabase
      .channel('pos_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pos_orders' },
        () => loadOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminLoading, loadOrders]);

  // Initialize pickup date/time
  useEffect(() => {
    setPickupDate(todayManila);
    setPickupTime(minTimeString);
  }, [todayManila, minTimeString]);

  // Analyze PDF file
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
      const analyzedPages: {pageNum: number; isColor: boolean; selected: boolean}[] = [];

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
        let isColorPage = false;
        for (let j = 0; j < imageData.data.length; j += 32) {
          const r = imageData.data[j];
          const g = imageData.data[j + 1];
          const b = imageData.data[j + 2];
          if (Math.abs(r - g) > 20 || Math.abs(r - b) > 20 || Math.abs(g - b) > 20) {
            isColorPage = true;
            break;
          }
        }
        analyzedPages.push({ pageNum: i, isColor: isColorPage, selected: true });
      }
      setPages(analyzedPages);
    } catch (err) {
      console.error("PDF analysis error:", err);
      toast.error("Failed to analyze PDF.");
      resetFile();
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
    setFileName(selected.name);
    setPages([]);
    await analyzePdf(selected);
  };

  const resetFile = () => {
    setFile(null);
    setFileName('');
    setPages([]);
    setAnalysisProgress(0);
  };

  // Calculate costs
  const calculateCost = (type: OrderType, pageSize: PageSize, isColor: boolean, pageCount: number, deliveryType: DeliveryType): number => {
    const basePrice = type === 'print' ? PRICING.print[pageSize][isColor ? 'color' : 'bw'] : PRICING.photocopy[pageSize][isColor ? 'color' : 'bw'];
    const total = basePrice * pageCount;
    const deliveryCost = deliveryType === 'delivery' ? PRICING.deliveryFee : 0;
    return total + deliveryCost;
  };

  // Add to cart
  const addToCart = async () => {
    if (orderType === 'print' && !file) {
      toast.error("Please upload a PDF file");
      return;
    }
    if (orderType === 'photocopy' && pageCount <= 0) {
      toast.error("Please enter a valid page count");
      return;
    }
    if (!customerId && !customerName) {
      toast.error("Please select or enter a customer");
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

    // Calculate pages
    let totalPages = 0;
    let bwPages = 0;
    let coloredPages = 0;

    if (orderType === 'print') {
      const selectedPages = pages.filter(p => p.selected);
      if (selectedPages.length === 0) {
        toast.error("Please select at least one page to print");
        return;
      }
      totalPages = selectedPages.length;
      bwPages = selectedPages.filter(p => !p.isColor).length;
      coloredPages = selectedPages.filter(p => p.isColor).length;
    } else {
      totalPages = pageCount;
      bwPages = isColor ? 0 : pageCount;
      coloredPages = isColor ? pageCount : 0;
    }

    const cost = calculateCost(orderType, pageSize, isColor, totalPages, deliveryType);

    const cartItem = {
      id: Date.now().toString(),
      type: orderType,
      file,
      fileName: orderType === 'print' ? fileName : undefined,
      fileUrl: orderType === 'print' ? undefined : undefined,
      totalPages,
      bwPages,
      coloredPages,
      pageSize,
      deliveryType,
      pickupDate,
      pickupTime,
      cost,
      customerId: customerId || undefined,
      customerName: customerName || (customerId ? `${customers.find(c => c.id === customerId)?.first_name} ${customers.find(c => c.id === customerId)?.last_name}` : undefined),
      customerGrade: customerGrade || (customerId ? customers.find(c => c.id === customerId)?.grade_level : undefined),
      customerSection: customerSection || (customerId ? customers.find(c => c.id === customerId)?.section : undefined),
      isColor,
      pageCount: totalPages,
    };

    setCart([...cart, cartItem]);
    
    // Reset form
    if (orderType === 'print') resetFile();
    setPageCount(1);
    setIsColor(false);
    setCustomerId('');
    setCustomerName('');
    setCustomerGrade('');
    setCustomerSection('');
    
    toast.success("Order added to cart!");
  };

  // Remove from cart
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Checkout - submit all cart items
  const checkout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      // Upload files and submit orders
      const orderPromises = cart.map(async (item) => {
        let fileUrl = item.fileUrl;
        let fileName = item.fileName;

        if (item.type === 'print' && item.file) {
          const fileExt = item.file.name.split('.').pop();
          const filePath = `${user?.id || 'admin'}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("print-files")
            .upload(filePath, item.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("print-files")
            .getPublicUrl(filePath);

          fileUrl = publicUrl;
          fileName = item.file.name;
        }

        const { data: orderData, error } = await (supabase as any)
          .from('pos_orders')
          .insert({
            user_id: item.customerId || null,
            order_type: item.type,
            file_url: item.type === 'print' ? fileUrl : null,
            file_name: item.type === 'print' ? fileName : null,
            total_pages: item.totalPages,
            bw_pages: item.bwPages,
            colored_pages: item.coloredPages,
            page_size: item.pageSize,
            delivery_type: item.deliveryType,
            pickup_date: item.pickupDate,
            pickup_time: item.pickupTime,
            cost: item.cost,
            status: 'pending',
            customer_name: item.customerName || null,
            customer_grade: item.customerGrade || null,
            customer_section: item.customerSection || null,
          })
          .select()
          .single();

        if (error) throw error;
        return orderData;
      });

      const results = await Promise.all(orderPromises);
      
      // Clear cart
      clearCart();
      
      toast.success(`Successfully processed ${results.length} order(s)!`);
      
      // Refresh orders
      await loadOrders();
    } catch (error: any) {
      toast.error("Failed to process orders: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await (supabase as any)
        .from('pos_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Order status updated!");
      await loadOrders();
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  // Get customer name
  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Walk-in';
  };

  // Get order status badge
  const getStatusBadge = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, {color: string; text: string}> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', text: 'Approved' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      canceled: { color: 'bg-gray-100 text-gray-800', text: 'Canceled' },
    };
    return <Badge className={statusMap[status].color}>{statusMap[status].text}</Badge>;
  };

  // Check if user is admin
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Access denied. Only admins can access the POS system.");
      navigate('/');
    }
  }, [adminLoading, isAdmin, navigate]);

  if (adminLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">POS System</h1>
          <p className="text-sm text-muted-foreground">Print & Photocopy Services</p>
        </div>
        <Badge variant="outline">Admin Mode</Badge>
      </div>

      {/* Tabs for Order Type */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderType)} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="print" className="flex items-center gap-2">
            <Printer className="h-4 w-4" /> Print
          </TabsTrigger>
          <TabsTrigger value="photocopy" className="flex items-center gap-2">
            <Copy className="h-4 w-4" /> Photocopy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="print" className="space-y-4 mt-4">
          {/* Print Order Form */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" /> Print Order Details
            </h3>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Upload PDF
              </Label>
              {!file ? (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-bold">Tap to upload PDF</p>
                    <p className="text-xs text-muted-foreground mt-1">Max 50MB • PDF Only</p>
                  </label>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-xs font-bold truncate">{fileName}</p>
                      <p className="text-xs text-muted-foreground">{pages.length || '...'} pages</p>
                    </div>
                  </div>
                  <button onClick={resetFile} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Page Selection (if PDF uploaded) */}
            {pages.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-bold">Select Pages to Print</Label>
                <div className="flex gap-2 mb-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const allSelected = pages.every(p => p.selected);
                    setPages(pages.map(p => ({ ...p, selected: !allSelected })));
                  }}>
                    {pages.every(p => p.selected) ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setPages(pages.map(p => ({ ...p, selected: !p.isColor })));
                  }}>
                    Select Color Pages
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setPages(pages.map(p => ({ ...p, selected: p.isColor })));
                  }}>
                    Select B&W Pages
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                  {pages.map((page) => (
                    <div key={page.pageNum} className="text-center">
                      <button
                        onClick={() => {
                          setPages(pages.map(p => p.pageNum === page.pageNum ? { ...p, selected: !p.selected } : p));
                        }}
                        className={`w-full p-2 rounded-lg border ${page.selected ? 'border-primary bg-primary/10' : 'border-border'}`}
                      >
                        <span className="text-xs font-bold">#{page.pageNum}</span>
                        <div className="text-xs mt-1">
                          {page.isColor ? <span className="text-orange-500">🎨</span> : <span className="text-gray-500">⚫</span>}
                        </div>
                        {page.selected && <CheckCircle2 className="h-3 w-3 text-primary mx-auto mt-1" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyzing && (
              <div className="py-4 text-center">
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{analysisProgress}%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Analyzing document...</p>
              </div>
            )}
          </Card>

          {/* Customer Selection */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Customer Information
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name} ({customer.grade_level}-{customer.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {customerId === '' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">First Name</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter first name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Last Name</Label>
                    <Input value={customerGrade} onChange={(e) => setCustomerGrade(e.target.value)} placeholder="Enter last name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Grade</Label>
                    <Input value={customerGrade} onChange={(e) => setCustomerGrade(e.target.value)} placeholder="e.g., 11" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Section</Label>
                    <Input value={customerSection} onChange={(e) => setCustomerSection(e.target.value)} placeholder="e.g., A" />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Print Settings */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" /> Print Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Paper Size</Label>
                <Select value={pageSize} onValueChange={(value) => setPageSize(value as PageSize)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Delivery Method</Label>
                <Select value={deliveryType} onValueChange={(value) => setDeliveryType(value as DeliveryType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery (+₱10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Pickup Date</Label>
                <Input type="date" value={pickupDate} min={todayManila} max={todayManila} disabled className="text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Pickup Time</Label>
                <Input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  min={noTimesToday ? undefined : minTimeString}
                  disabled={noTimesToday}
                  className="text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Add to Cart Button */}
          <Button
            onClick={addToCart}
            disabled={!file || pages.length === 0 || pages.every(p => !p.selected) || submitting}
            className="w-full h-12 font-bold rounded-xl"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add to Cart
          </Button>
        </TabsContent>

        <TabsContent value="photocopy" className="space-y-4 mt-4">
          {/* Photocopy Order Form */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Copy className="h-4 w-4 text-primary" /> Photocopy Order Details
            </h3>

            {/* Page Count */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Number of Pages</Label>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPageCount(Math.max(1, pageCount - 1))}
                  disabled={pageCount <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(Math.max(1, Number(e.target.value)) || 1)}
                  className="w-20 text-center text-sm font-bold"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPageCount(pageCount + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Color/BW Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Color Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox checked={!isColor} onCheckedChange={() => setIsColor(false)} />
                  <span className="text-sm">Black & White</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox checked={isColor} onCheckedChange={() => setIsColor(true)} />
                  <span className="text-sm">Color</span>
                </label>
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Paper Size</Label>
              <Select value={pageSize} onValueChange={(value) => setPageSize(value as PageSize)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Customer Information (same as print) */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Customer Information
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name} ({customer.grade_level}-{customer.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {customerId === '' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">First Name</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter first name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Last Name</Label>
                    <Input value={customerGrade} onChange={(e) => setCustomerGrade(e.target.value)} placeholder="Enter last name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Grade</Label>
                    <Input value={customerGrade} onChange={(e) => setCustomerGrade(e.target.value)} placeholder="e.g., 11" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Section</Label>
                    <Input value={customerSection} onChange={(e) => setCustomerSection(e.target.value)} placeholder="e.g., A" />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Delivery Settings (same as print) */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Delivery & Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">Delivery Method</Label>
                <Select value={deliveryType} onValueChange={(value) => setDeliveryType(value as DeliveryType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery (+₱10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">Pickup Date</Label>
                <Input type="date" value={pickupDate} min={todayManila} max={todayManila} disabled className="text-xs" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs font-bold">Pickup Time</Label>
                <Input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  min={noTimesToday ? undefined : minTimeString}
                  disabled={noTimesToday}
                  className="text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Add to Cart Button */}
          <Button
            onClick={addToCart}
            disabled={pageCount <= 0 || submitting}
            className="w-full h-12 font-bold rounded-xl"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add to Cart
          </Button>
        </TabsContent>
      </Tabs>

      {/* Cart Section */}
      {cart.length > 0 && (
        <Card className="p-4 mt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" /> Cart ({cart.length})
            </h3>
            <Button size="sm" variant="outline" onClick={clearCart}>
              <Trash2 className="h-3 w-3 mr-1" /> Clear All
            </Button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.type === 'print' ? <Printer className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-secondary" />}
                    <div>
                      <p className="text-xs font-bold">
                        {item.type === 'print' ? 'Print' : 'Photocopy'}
                        {item.customerName && ` - ${item.customerName}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.pageCount} pages • {item.pageSize.toUpperCase()} • {item.deliveryType === 'delivery' ? 'Delivery (+₱10)' : 'Pickup'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-primary">₱{item.cost.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">Total</span>
              <span className="text-lg font-extrabold text-primary">₱{cart.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}</span>
            </div>
            <Button
              onClick={checkout}
              disabled={submitting}
              className="w-full h-12 font-bold rounded-xl"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {submitting ? 'Processing...' : 'Checkout All Orders'}
            </Button>
          </div>
        </Card>
      )}

      {/* Orders List */}
      <Card className="p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Recent Orders
          </h3>
          <Button size="sm" variant="outline" onClick={loadOrders}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedOrderId(order.id);
                  // Simple modal simulation - in real app use proper modal
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {order.order_type === 'print' ? <Printer className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-secondary" />}
                    <div>
                      <p className="text-xs font-bold">
                        {order.order_type === 'print' ? 'Print' : 'Photocopy'}
                        {order.customer_name && ` - ${order.customer_name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">₱{order.cost.toFixed(2)}</p>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>
            ))}
            {orders.length > 10 && (
              <p className="text-xs text-muted-foreground text-center mt-2">Showing 10 of {orders.length} orders</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}