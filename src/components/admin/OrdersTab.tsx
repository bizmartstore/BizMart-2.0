import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Truck, Package, Eye, ShoppingCart, Printer, Loader2, RefreshCw } from "lucide-react";
import { sendNotification, notifyCustomerBCoins } from "@/lib/notifications";

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadOrders = useCallback(async (showToast = false) => {
    try {
      const [ordersRes, printRes, posRes] = await Promise.allSettled([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("print_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("pos_sales").select("*").order("created_at", { ascending: false }),
      ]);

      const ordersData = ordersRes.status === 'fulfilled' && !ordersRes.value.error ? ordersRes.value.data || [] : [];
      const printData = printRes.status === 'fulfilled' && !printRes.value.error ? printRes.value.data || [] : [];
      const posData = posRes.status === 'fulfilled' && !posRes.value.error ? posRes.value.data || [] : [];

      const combined = [
        ...ordersData.map((o: any) => ({ ...o, order_type: 'product' })),
        ...printData.map((p: any) => ({ ...p, order_type: 'print' })),
        ...posData.map((p: any) => ({ ...p, order_type: 'pos' })),
      ];
      setOrders(combined);
      
      if (showToast && (ordersRes.status === 'rejected' || ordersRes.value?.error)) {
        toast.error("Failed to load some orders");
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
      if (showToast) toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        console.log("[OrdersTab] orders changed, reloading...");
        loadOrders();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => {
        console.log("[OrdersTab] print_orders changed, reloading...");
        loadOrders();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_sales" }, () => {
        console.log("[OrdersTab] pos_sales changed, reloading...");
        loadOrders();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("[OrdersTab] Real-time subscription active");
        } else if (status === 'CHANNEL_ERROR') {
          console.warn("[OrdersTab] Real-time channel error, relying on polling");
        }
      });

    pollIntervalRef.current = setInterval(() => {
      loadOrders();
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [loadOrders]);

  const updateStatus = async (orderId: string, newStatus: string, orderType: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      let table = "orders";
      if (orderType === "print") table = "print_orders";
      if (orderType === "pos") table = "pos_sales";

      const { data: order } = await (supabase as any).from(table).select("*").eq("id", orderId).maybeSingle();
      if (!order) {
        toast.error("Order not found");
        return;
      }

      const { error } = await (supabase as any).from(table).update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      
      if (newStatus === "completed" && orderType !== 'pos' && order.user_id) {
        const bcoins = Number(order.bcoins_earned || 0);
        if (bcoins > 0) {
          await notifyCustomerBCoins(order.user_id, bcoins, `Order #${orderId.slice(0, 8)} completed`);
        }
      }

      if (orderType !== 'pos' && order.user_id) {
        const notifType = orderType === 'print' ? 'print_status' : 'order_status';
        const icon = orderType === 'print' ? '🖨️' : '📦';
        const message = orderType === 'print' 
          ? `Your print request for "${order.file_name}" is now ${newStatus}.`
          : `Your order #${orderId.slice(0, 8)} is now ${newStatus}.`;
          
        await sendNotification({
          title: `${icon} ${orderType === 'print' ? 'Print Request' : 'Order'} ${newStatus.toUpperCase()}`,
          message,
          type: notifType,
          userId: order.user_id,
          link: "/orders",
          icon
        });
      }

      toast.success(`${orderType === 'pos' ? 'POS' : orderType === 'print' ? 'Print' : 'Order'} ${newStatus}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
      loadOrders();
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || 
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.order_type || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => o.status === "approved").length,
    ready: orders.filter(o => o.status === "ready").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
    canceled: orders.filter(o => o.status === "canceled").length,
  };

  if (selectedOrder) {
    const isPOS = selectedOrder.order_type === 'pos';
    const isPrint = selectedOrder.order_type === 'print';
    const items = selectedOrder.items || [];
    
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedOrder(null)} className="text-xs text-primary font-bold">← Back to Orders</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">
                {isPOS ? 'POS Sale' : isPrint ? 'Print Order' : `Order #${selectedOrder.id.slice(0, 8)}`}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {selectedOrder.customer_name || "Customer"} • {new Date(selectedOrder.created_at).toLocaleString()}
                {isPOS && <span className="ml-2 text-primary font-bold">(POS)</span>}
                {isPrint && <span className="ml-2 text-purple-500 font-bold">(Print)</span>}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py=1 rounded-full ${
              selectedOrder.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
              selectedOrder.status === 'pending' ? 'bg-warning/20 text-warning' :
              selectedOrder.status === 'rejected' || selectedOrder.status === 'canceled' ? 'bg-destructive/20 text-destructive' :
              'bg-primary/20 text-primary'
            }`}>{selectedOrder.status.toUpperCase()}</span>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ITEMS</p>
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <span>{item.name} ×{item.quantity}</span>
                <span>₱{(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-1 mt-1">
              <div className="flex justify-between text-xs font-bold">
                <span>Total</span>
                <span className="text-primary">₱{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {selectedOrder.delivery_type && (
            <div className="text-[10px] text-muted-foreground">
              <p>{selectedOrder.delivery_type === 'delivery' ? '🚚 Delivery' : '📦 Pickup'} • {selectedOrder.pickup_date} at {selectedOrder.pickup_time}</p>
              {Number(selectedOrder.delivery_fee) > 0 && <p>Delivery Fee: ₱{Number(selectedOrder.delivery_fee).toFixed(2)}</p>}
            </div>
          )}

          {isPOS && (
            <div className="text-[10px] text-muted-foreground">
              <p>Sold by: {selectedOrder.sold_by?.slice(0, 8)}</p>
              {selectedOrder.customer_name && <p>Customer: {selectedOrder.customer_name}</p>}
            </div>
          )}

          {isPrint && (
            <div className="text-[10px] text-muted-foreground">
              <p>File: {selectedOrder.file_name}</p>
              <p>Pages: {selectedOrder.total_pages} (B&W: {selectedOrder.bw_pages}, Colored: {selectedOrder.colored_pages})</p>
              <p>Size: {selectedOrder.page_size}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {selectedOrder.status === "pending" && (
              <>
                <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "approved", selectedOrder.order_type)} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedOrder.id, "rejected", selectedOrder.order_type)} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Reject</Button>
              </>
            )}
            {selectedOrder.status === "approved" && (
              <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "ready", selectedOrder.order_type)} className="gap-1 flex-1"><Truck className="h-3 w-3" /> Mark Ready</Button>
            )}
            {selectedOrder.status === "ready" && (
              <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "completed", selectedOrder.order_type)} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Complete</Button>
            )}
            {["pending", "approved", "ready"].includes(selectedOrder.status) && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(selectedOrder.id, "canceled", selectedOrder.order_type)} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Cancel</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search all orders (products, print, POS)..." 
            className="pl-9 text-xs h-9" 
          />
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
              filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{key.charAt(0).toUpperCase() + key.slice(1)} ({count})</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(order => {
            const isPOS = order.order_type === 'pos';
            const isPrint = order.order_type === 'print';
            const items = order.items || [];
            
            return (
              <div key={order.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isPOS && <ShoppingCart className="h-4 w-4 text-primary flex-shrink-0" />}
                    {isPrint && <Printer className="h-4 w-4 text-purple-500 flex-shrink-0" />}
                    {!isPOS && !isPrint && <Package className="h-4 w-4 text-secondary flex-shrink-0" />}
                    <span className="text-xs font-bold truncate">
                      {isPOS ? `POS: ${order.customer_name || 'Walk-in'}` : 
                       isPrint ? `Print: ${order.file_name}` : 
                       order.customer_name || "Customer"}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                      order.status === 'pending' ? 'bg-warning/20 text-warning' :
                      order.status === 'rejected' || order.status === 'canceled' ? 'bg-destructive/20 text-destructive' :
                      'bg-primary/20 text-primary'
                    }`}>{order.status}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    #{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
                    {isPOS && <span className="ml-1 text-primary">• POS Sale</span>}
                    {isPrint && <span className="ml-1 text-purple-500">• Print</span>}
                  </p>
                  {isPOS && items.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {items.slice(0, 2).map((i: any) => i.name).join(', ')}
                      {items.length > 2 && ` +${items.length - 2} more`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary">₱{Number(order.total || order.cost || 0).toFixed(2)}</span>
                  <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No orders found</p>}
        </div>
      )}
    </div>
  );
}