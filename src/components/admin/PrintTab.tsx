import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Printer, RefreshCw, FileText, Truck, MapPin } from "lucide-react";
import { sendNotification } from "@/lib/notifications";

export default function PrintTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Object.entries(statusCounts).map(([key, count]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{key.charAt(0).toUpperCase() + key.slice(1)} ({count})</button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(order => (
          <div key={order.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-bold text-xs truncate">{order.file_name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                order.status === 'pending' ? 'bg-warning/20 text-warning' :
                order.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                'bg-primary/20 text-primary'
              }`}>{order.status}</span>
            </div>

            {/* Customer Details */}
            <div className="bg-muted/30 rounded-lg p-2 mb-2 space-y-0.5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Customer</p>
              <p className="text-xs font-semibold text-foreground">{order.customer_name || "Unknown User"}</p>
              <p className="text-[10px] text-muted-foreground">
                {order.customer_grade_level || "N/A"} • {order.customer_section || "N/A"}
              </p>
              <p className="text-[10px] text-muted-foreground">{order.user_email || order.customer_contact || "No contact"}</p>
            </div>

            {/* Delivery Details */}
            <div className="bg-muted/30 rounded-lg p-2 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {order.delivery_type === 'delivery' ? (
                  <Truck className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                )}
                <span className="text-[10px] font-bold capitalize text-foreground">{order.delivery_type || 'pickup'}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {order.pickup_date || "N/A"} at {order.pickup_time || "N/A"}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center mb-2">
              <div className="bg-muted rounded-lg p-1.5">
                <span className="text-sm font-extrabold block">{order.total_pages}</span>
                <span className="text-[9px] text-muted-foreground">Total</span>
              </div>
              <div className="bg-muted rounded-lg p-1.5">
                <span className="text-sm font-extrabold block">{order.bw_pages}</span>
                <span className="text-[9px] text-muted-foreground">B&W</span>
              </div>
              <div className="bg-muted rounded-lg p-1.5">
                <span className="text-sm font-extrabold block">{order.colored_pages}</span>
                <span className="text-[9px] text-muted-foreground">Colored</span>
              </div>
              <div className="bg-muted rounded-lg p-1.5">
                <span className="text-sm font-extrabold block">₱{Number(order.cost).toFixed(2)}</span>
                <span className="text-[9px] text-muted-foreground">Cost</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">{new Date(order.created_at).toLocaleString()}</p>
            <div className="flex gap-2">
              {order.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => updateStatus(order.id, "approved")} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, "rejected")} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Reject</Button>
                </>
              )}
              {order.status === "approved" && (
                <Button size="sm" onClick={() => updateStatus(order.id, "completed")} className="gap-1 w-full"><CheckCircle2 className="h-3 w-3" /> Mark Complete</Button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>}
      </div>
    </div>
  );
}