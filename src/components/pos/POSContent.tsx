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
import { Package, User, ShoppingCart, Printer, Copy, CheckCircle2, X, Loader2, Trash2, Plus, Minus, Truck, Home, Clock, AlertCircle, RefreshCw } from "lucide-react";

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
  user_id: string | null;
  order_type: OrderType;
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

// Pricing constants - FIXED: Corrected photocopy pricing
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
  const [activeTab, setActiveTab] = useState<OrderType>('print');
  const [orderType, setOrderType] = useState<OrderType>('print');
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [pickupTime, setPickupTime] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(1);
  const [isColor, setIsColor] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<string>('walk-in');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerGrade, setCustomerGrade] = useState<string>('');
  const [customerSection, setCustomerSection] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  // Calculate costs
  const calculateCost = (type: OrderType, pageSize: PageSize, isColor: boolean, pageCount: number, deliveryType: DeliveryType): number => {
    const basePrice = type === 'print' ? PRICING.print[pageSize][isColor ? 'color' : 'bw'] : PRICING.photocopy[pageSize][isColor ? 'color' : 'bw'];
    const total = basePrice * pageCount;
    const deliveryCost = deliveryType === 'delivery' ? PRICING.deliveryFee : 0;
    return total + deliveryCost;
  };

  // Auto-submit order when form changes (no cart, direct checkout)
  useEffect(() => {
    if (pageCount <= 0 || customerId === '' || pickupDate === '' || pickupTime === '') return;

    const cost = calculateCost(orderType, pageSize, isColor, pageCount, deliveryType);
    const customer = customerId === 'walk-in' ? null : customers.find(c => c.id === customerId);
    const customerNameFinal = customerId === 'walk-in' ? customerName : `${customer?.first_name || ''} ${customer?.last_name || ''}`;
    const customerGradeFinal = customerId === 'walk-in' ? customerGrade : customer?.grade_level;
    const customerSectionFinal = customerId === 'walk-in' ? customerSection : customer?.section;

    const newOrder: POSOrder = {
      id: Date.now().toString(),
      user_id: customerId === 'walk-in' ? null : customerId,
      order_type: orderType,
      total_pages: pageCount,
      bw_pages: isColor ? 0 : pageCount,
      colored_pages: isColor ? pageCount : 0,
      page_size: pageSize,
      delivery_type: deliveryType,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      cost,
      status: 'pending',
      created_at: new Date().toISOString(),
      customer_name: customerNameFinal || undefined,
      customer_grade: customerGradeFinal,
      customer_section: customerSectionFinal,
    };

    // Submit order immediately
    const submitOrder = async () => {
      try {
        await (supabase as any)
          .from('pos_orders')
          .insert([{
            user_id: newOrder.user_id,
            order_type: newOrder.order_type,
            total_pages: newOrder.total_pages,
            bw_pages: newOrder.bw_pages,
            colored_pages: newOrder.colored_pages,
            page_size: newOrder.page_size,
            delivery_type: newOrder.delivery_type,
            pickup_date: newOrder.pickup_date,
            pickup_time: newOrder.pickup_time,
            cost: newOrder.cost,
            status: newOrder.status,
            customer_name: newOrder.customer_name,
            customer_grade: newOrder.customer_grade,
            customer_section: newOrder.customer_section,
          }]);

        toast.success(`${orderType === 'print' ? 'Print' : 'Photocopy'} order submitted!`);
        loadOrders();
        
        // Reset form
        setPageCount(1);
        setIsColor(false);
        setCustomerId('walk-in');
        setCustomerName('');
        setCustomerGrade('');
        setCustomerSection('');
      } catch (error) {
        toast.error("Failed to submit order");
      }
    };

    submitOrder();
  }, [pageCount, orderType, pageSize, isColor, deliveryType, pickupDate, pickupTime, customerId, customerName, customerGrade, customerSection, customers, loadOrders]);

  // Update order status
  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { error } = await (supabase as any)
        .from('pos_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast.success("Order status updated!");
      loadOrders();
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  // Get customer name
  const getCustomerName = (customerId: string) => {
    if (customerId === 'walk-in') return 'Walk-in';
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Customer';
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
          {/* Print Order Form - Jollibee/Mall Style */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" /> Print Order
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

            {/* Delivery Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-bold">Delivery Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryType === "pickup" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
                >
                  <Home className="h-3.5 w-3.5" /> Pickup
                </button>
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryType === "delivery" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
                >
                  <Truck className="h-3.5 w-3.5" /> Delivery (+₱10)
                </button>
              </div>
            </div>

            {/* Pickup Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Pickup Date</Label>
                <Input type="date" value={pickupDate} min={todayManila} max={todayManila} disabled className="text-xs" />
              </div>
              <div className="space-y-1">
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

            {/* Customer Selection - FIXED: Empty string value issue */}
            <div className="space-y-3">
              <Label className="text-sm font-bold">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">🚶 Walk-in Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} ({customer.grade_level}-{customer.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {customerId !== 'walk-in' && (
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

            {/* Cost Display */}
            <div className="bg-primary/5 rounded-xl p-3">
              <p className="text-sm font-bold">
                Cost: ₱{calculateCost(orderType, pageSize, isColor, pageCount, deliveryType).toFixed(2)}
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="photocopy" className="space-y-4 mt-4">
          {/* Photocopy Order Form - Same style as print */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Copy className="h-4 w-4 text-primary" /> Photocopy Order
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

            {/* Delivery Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-bold">Delivery Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryType === "pickup" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
                >
                  <Home className="h-3.5 w-3.5" /> Pickup
                </button>
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${deliveryType === "delivery" ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"}`}
                >
                  <Truck className="h-3.5 w-3.5" /> Delivery (+₱10)
                </button>
              </div>
            </div>

            {/* Pickup Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Pickup Date</Label>
                <Input type="date" value={pickupDate} min={todayManila} max={todayManila} disabled className="text-xs" />
              </div>
              <div className="space-y-1">
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

            {/* Customer Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-bold">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">🚶 Walk-in Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.first_name} {customer.last_name} ({customer.grade_level}-{customer.section})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {customerId !== 'walk-in' && (
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

            {/* Cost Display */}
            <div className="bg-primary/5 rounded-xl p-3">
              <p className="text-sm font-bold">
                Cost: ₱{calculateCost(orderType, pageSize, isColor, pageCount, deliveryType).toFixed(2)}
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Orders List - Display recent orders */}
      <Card className="p-4">
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
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {order.order_type === 'print' ? <Printer className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-secondary" />}
                    <div>
                      <p className="text-xs font-bold">
                        {order.order_type === 'print' ? 'Print' : 'Photocopy'} - {order.customer_name || 'Walk-in'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)} • {order.page_size.toUpperCase()} • {order.total_pages} pages
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