import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Printer, RefreshCw, FileText } from "lucide-react";

export default function PrintTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "completed" | "rejected">("all");
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
      
      await (supabase as any).from("notification_logs").insert({
        user_id: order.user_id,
        title: `🖨️ Print Request ${newStatus.toUpperCase()}`,
        message: `Your print request for "${order.file_name}" is now ${newStatus}.`,
        type: "print_status",
        userId,
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
          {["all", "pending", "approved", "completed", "rejected"].map(key => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)} ({statusCounts[key] ?? 0})
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(order => (
          <div key={order.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="font-bold text-xs truncate">{order.file_name}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : order.status === 'pending' ? 'bg-warning/20 text-warning' : order.status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>{order.status}</span>
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
            <p className="text-[10px] text-muted-foreground mb-2">{order.user_email || "User"} • {new Date(order.created_at).toLocaleString()}</p>
            {order.reference_number && <p className="text-[10px] text-muted-foreground mb-2">Ref: {order.reference_number}</p>}
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
      </div>
    </div>
  );
}