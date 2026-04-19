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
import { Package, User, ShoppingCart, Printer, Copy, CheckCircle2, X, Loader2, Plus, Minus, Truck, Users, PackageCheck } from "lucide-react";

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

// Pricing constants - FIXED AS REQUESTED
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
  const [cart, setCart] = useState<POSOrder[]>([]);
  const [activeTab, setActiveTab] = useState<OrderType>('print');
  const [orderType, setOrderType] = useState<OrderType>('print');
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

  // Auto-add to cart/checkout when selection changes
  useEffect(() => {
    if (pageCount <= 0 || !customerId) return;

    const cost = calculateCost(orderType, pageSize, isColor, pageCount, deliveryType);

    const newOrder: POSOrder = {
      id: Date.now().toString(),
      user_id: customerId,
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
      customer_name: customerId ? `${customers.find(c => c.id === customerId)?.first_name} ${customers.find(c => c.id === customerId)?.last_name}` : undefined,
      customer_grade: customerGrade || (customerId ? customers.find(c => c.id === customerId)?.grade_level : undefined),
      customer_section: customerSection || (customerId ? customers.find(c => c.id === customerId)?.section : undefined),
    };

    // Auto-checkout - submit immediately
    submitOrder(newOrder);
  }, [pageCount, isColor, pageSize, deliveryType, customerId, customerGrade, customerSection, orderType, pickupDate, pickupTime, customers]);

  // Submit order directly (auto-checkout)
  const submitOrder = async (order: POSOrder) => {
    if (!user) {
      toast.error("Please login as admin");
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

    setSubmitting(true);
    try {
      const { data: orderData, error } = await (supabase as any)
        .from('pos_orders')
        .insert({
          user_id: order.user_id || null,
          order_type: order.order_type,
          total_pages: order.total_pages,
          bw_pages: order.bw_pages,
          colored_pages: order.colored_pages,
          page_size: order.page_size,
          delivery_type: order.delivery_type,
          pickup_date: order.pickup_date,
          pickup_time: order.pickup_time,
          cost: order.cost,
          status: 'pending',
          customer_name: order.customer_name || null,
          customer_grade: order.customer_grade || null,
          customer_section: order.customer_section || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (orderData) {
        toast.success(`✓ Order #${orderData.id.slice(0, 8)} - ₱${order.cost.toFixed(2)}`);
        setCart([...cart, orderData]);
        // Reset form
        setPageCount(1);
        setIsColor(false);
      }
    } catch (error: any) {
      toast.error("Failed to process order: " + error.message);
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
          {/* Print Order Form - SIMPLIFIED */}
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
                  disabled={pageCount <= 1 || submitting}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(Math.max(1, Number(e.target.value)) || 1)}
                  className="w-20 text-center text-sm font-bold"
                  disabled={submitting}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPageCount(pageCount + 1)}
                  disabled={submitting}
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
                  <Checkbox
                    checked={!isColor}
                    onCheckedChange={() => setIsColor(false)}
                    disabled={submitting}
                  />
                  <span className="text-sm">Black & White</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={isColor}
                    onCheckedChange={() => setIsColor(true)}
                    disabled={submitting}
                  />
                  <span className="text-sm">Color</span>
                </label>
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Paper Size</Label>
              <Select
                value={pageSize}
                onValueChange={(value) => setPageSize(value as PageSize)}
                disabled={submitting}
              >
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

            {/* Delivery Method */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Delivery Method</Label>
              <Select
                value={deliveryType}
                onValueChange={(value) => setDeliveryType(value as DeliveryType)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery (+₱10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Display - UPDATED */}
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-sm font-bold">
                Cost: ₱{calculateCost('print', pageSize, isColor, pageCount, deliveryType).toFixed(2)}
              </p>
            </div>
          </Card>

          {/* Customer Selection */}
          <Card className="p-4 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Customer Information
            </h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Customer</Label>
                <Select
                  value={customerId}
                  onValueChange={setCustomerId}
                  disabled={submitting}
                >
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
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter first name"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Last Name</Label>
                    <Input
                      value={customerGrade}
                      onChange={(e) => setCustomerGrade(e.target.value)}
                      placeholder="Enter last name"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Grade</Label>
                    <Input
                      value={customerGrade}
                      onChange={(e) => setCustomerGrade(e.target.value)}
                      placeholder="e.g., 11"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Section</Label>
                    <Input
                      value={customerSection}
                      onChange={(e) => setCustomerSection(e.target.value)}
                      placeholder="e.g., A"
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="photocopy" className="space-y-4 mt-4">
          {/* Photocopy Order Form - SIMPLIFIED */}
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
                  disabled={pageCount <= 1 || submitting}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(Math.max(1, Number(e.target.value)) || 1)}
                  className="w-20 text-center text-sm font-bold"
                  disabled={submitting}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPageCount(pageCount + 1)}
                  disabled={submitting}
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
                  <Checkbox
                    checked={!isColor}
                    onCheckedChange={() => setIsColor(false)}
                    disabled={submitting}
                  />
                  <span className="text-sm">Black & White</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={isColor}
                    onCheckedChange={() => setIsColor(true)}
                    disabled={submitting}
                  />
                  <span className="text-sm">Color</span>
                </label>
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Paper Size</Label>
              <Select
                value={pageSize}
                onValueChange={(value) => setPageSize(value as PageSize)}
                disabled={submitting}
              >
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

            {/* Delivery Method */}
            <div className="space-y-2">
              <Label className="text-sm font-bold">Delivery Method</Label>
              <Select
                value={deliveryType}
                onValueChange={(value) => setDeliveryType(value as DeliveryType)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery (+₱10)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Display - UPDATED */}
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-sm font-bold">
                Cost: ₱{calculateCost('photocopy', pageSize, isColor, pageCount, deliveryType).toFixed(2)}
              </p>
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
                <Select
                  value={customerId}
                  onValueChange={setCustomerId}
                  disabled={submitting}
                >
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
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter first name"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Last Name</Label>
                    <Input
                      value={customerGrade}
                      onChange={(e) => setCustomerGrade(e.target.value)}
                      placeholder="Enter last name"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Grade</Label>
                    <Input
                      value={customerGrade}
                      onChange={(e) => setCustomerGrade(e.target.value)}
                      placeholder="e.g., 11"
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Section</Label>
                    <Input
                      value={customerSection}
                      onChange={(e) => setCustomerSection(e.target.value)}
                      placeholder="e.g., A"
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}
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
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <PackageCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
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
                        #{order.id.slice(0, 8)} • {order.total_pages} pages • {order.page_size.toUpperCase()}
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