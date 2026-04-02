import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Truck, Package, RefreshCw, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "ready" | "rejected" | "canceled">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data: order } = await (supabase as any).from("orders").select("*").eq("id", orderId).maybeSingle();
      if (!order) return;

      await (supabase as any).from("orders").update({ status: newStatus }).eq("id", orderId);
      
      // Notify customer
      await (supabase as any).from("notification_logs").insert({
        user_id: order.user_id,
        title: `🛒 Order ${newStatus.toUpperCase()}`,
        message: `Your order #${orderId.slice(0, 8)} is now ${newStatus}.`,
        type: "order_status",
        userId,
        link: "/orders",
        icon: "📦"
      });

      toast.success(`Order ${newStatus}!`);
      loadOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
    }
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || 
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||       o.id.toLowerCase().includes(search.toLowerCase());
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
    const items = selectedOrder.items || [];
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedOrder(null)} className="text-xs text-primary font-bold">← Back to Orders</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Order #{selectedOrder.id.slice(0, 8)}</h3>
              <p className="text-[10px] text-muted-foreground">{selectedOrder.customer_name || "Customer"} • {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedOrder.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : selectedOrder.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>{selectedOrder.status.toUpperCase()}</span>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground">ITEMS</p>
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <span>{item.name}</span>
                <span>₱{(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-1 mt-1">
              <div className="flex justify-between text-xs font-bold">
                <span>Total</span>
                <span className="text-primary">₱{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
            </div>
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
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="pl-9 text-xs h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={loadOrders} disabled={loading}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "pending", "approved", "ready", "completed", "rejected", "canceled"].map(key => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {key.charAt(0).toUpperCase() + key.slice(1)} ({filterCounts[key] ?? 0})
          </button>
        ))
      </div>
    </div>
  );
}