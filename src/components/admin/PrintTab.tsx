import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Printer, RefreshCw, FileText } from "lucide-react";
import { sendNotification } from "@/lib/notifications";

export default function PrintTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("print_orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data: order } = await (supabase as any).from("print_orders").select("*").eq("id", orderId).maybeSingle();
      if (!order) return;

      await (supabase as any).from("print_orders").update({ status: newStatus }).eq("id", orderId);
      
      await sendNotification({
        title: `🖨️ Print Request ${newStatus.toUpperCase()}`,
        message: `Your print request for "${order.file_name}" is now ${newStatus}.`,
        type: "print_status",
        userId: order.user_id,
        link: "/orders",
        icon: "🖨️"
      });

      toast.success(`Print order ${newStatus}!`);
      load();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => o.status === "approved").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
  };

  if (selectedOrder) {
    const items = selectedOrder.items || [];
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedOrder(null)} className="text-xs text-primary font-bold">← Back to Print Orders</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Print Order #{selectedOrder.id.slice(0, 8)}</h3>
              <p className="text-[10px] text-muted-foreground">{selectedOrder.customer_name || "Customer"} • {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              selectedOrder.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
              selectedOrder.status === 'pending' ? 'bg-warning/20 text-warning' :
              selectedOrder.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
              'bg-primary/20 text-primary'
            }`}>{selectedOrder.status}</span>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground">ITEMS</p>
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <div>{item.name} ×{item.quantity}</div>
                <div>₱{(Number(item.price) * item.quantity).toFixed(2)}</div>
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
              {selectedOrder.delivery_type === 'delivery' ? '🚚 Delivery' : '📦 Pickup'} — {selectedOrder.pickup_date} at {selectedOrder.pickup_time}
              {Number(selectedOrder.delivery_fee) > 0 && <span className="text-[10px] font-bold">+₱{Number(selectedOrder.delivery_fee).toFixed(2)} fee</span>}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {selectedOrder.status === "pending" && (
              <>
                <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "completed")} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedOrder.id, "rejected")} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Reject</Button>
              </>
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
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="pl-9 text-sm h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
              filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
            {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(order => (
          <div key={order.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold truncate">{order.customer_name || "Customer"}</span>
                <span className="text-[10px] text-muted-foreground">#{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleString()}</span>
              </div>
              <span className="font-bold text-sm text-primary">₱{Number(order.total).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-primary">₱{Number(order.total).toFixed(2)}</span>
              <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>}
      </div>
    </div>
  );
}