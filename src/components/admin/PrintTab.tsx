import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Printer, RefreshCw, FileText, Truck, MapPin, User, Search, Eye } from "lucide-react";
import { sendNotification } from "@/lib/notifications";
import { Input } from "@/components/ui/input";

export default function PrintTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("print_orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { 
    load(); 
    
    // Realtime subscription for instant updates
    const channel = supabase
      .channel("print-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => {
        load();
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [load]);

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

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || 
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.file_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_section || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => o.status === "approved").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
  };

  if (selectedOrder) {
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedOrder(null)} className="text-xs text-primary font-bold">← Back to Print Orders</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> {selectedOrder.file_name}
              </h3>
              <p className="text-[10px] text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              selectedOrder.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
              selectedOrder.status === 'pending' ? 'bg-warning/20 text-warning' :
              selectedOrder.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
              'bg-primary/20 text-primary'
            }`}>{selectedOrder.status.toUpperCase()}</span>
          </div>

          {/* Customer Details */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Information</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{selectedOrder.customer_name || "Unknown User"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {selectedOrder.customer_grade_level || "N/A"} • {selectedOrder.customer_section || "N/A"}
            </p>
          </div>

          {/* Delivery Details */}
          <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedOrder.delivery_type === 'delivery' ? (
                <Truck className="h-4 w-4 text-primary" />
              ) : (
                <MapPin className="h-4 w-4 text-primary" />
              )}
              <span className="text-xs font-bold capitalize text-foreground">{selectedOrder.delivery_type || 'pickup'}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {selectedOrder.pickup_date || "N/A"} at {selectedOrder.pickup_time || "N/A"}
            </span>
          </div>

          {/* Print Details */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold block">{selectedOrder.total_pages}</span>
              <span className="text-[9px] text-muted-foreground">Total</span>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold block">{selectedOrder.bw_pages}</span>
              <span className="text-[9px] text-muted-foreground">B&W</span>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold block">{selectedOrder.colored_pages}</span>
              <span className="text-[9px] text-muted-foreground">Color</span>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold block">₱{Number(selectedOrder.cost).toFixed(2)}</span>
              <span className="text-[9px] text-muted-foreground">Cost</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Paper: {selectedOrder.page_size === 'short' ? 'Short/A4' : 'Long (8.5x13)'}</p>

          <div className="flex flex-wrap gap-2">
            {selectedOrder.status === "pending" && (
              <>
                <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "approved")} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedOrder.id, "rejected")} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Reject</Button>
              </>
            )}
            {selectedOrder.status === "approved" && (
              <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "completed")} className="gap-1 w-full"><CheckCircle2 className="h-3 w-3" /> Mark Complete</Button>
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
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, file, or section..." className="pl-9 text-xs h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
              filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{key.charAt(0).toUpperCase() + key.slice(1)} ({count})</button>
        ))}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(order => (
          <div key={order.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-bold text-xs truncate">{order.file_name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                order.status === 'pending' ? 'bg-warning/20 text-warning' :
                order.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                'bg-primary/20 text-primary'
              }`}>{order.status}</span>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-2 mb-2 text-[10px] text-muted-foreground">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="font-bold text-foreground">{order.customer_name || "Unknown"}</span>
              <span>•</span>
              <span>{order.customer_grade_level || "N/A"} - {order.customer_section || "N/A"}</span>
            </div>

            {/* Delivery & Cost */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                {order.delivery_type === 'delivery' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                <span className="capitalize">{order.delivery_type || 'pickup'}</span>
                <span>•</span>
                <span>{order.pickup_date || "N/A"} {order.pickup_time || ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-primary">₱{Number(order.cost).toFixed(2)}</span>
                <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>}
      </div>
    </div>
  );
}