import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText, Truck, MapPin, User, Search, Eye, Loader2, RefreshCw, AlertCircle, Palette, File, Download } from "lucide-react";
import { notifyCustomerOrder } from "@/lib/notifications";

export default function PrintTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
      setDbError(null);
    }
    
    try {
      const { data: printData, error } = await (supabase as any)
        .from("print_orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      const userIds = (printData || []).map((o: any) => o.user_id).filter(Boolean);
      let profileMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, first_name, last_name, grade_level, section")
          .in("user_id", userIds);
        
        if (profiles) {
          profiles.forEach((p: any) => { profileMap[p.user_id] = p; });
        }
      }

      const enriched = (printData || []).map((order: any) => ({
        ...order,
        customer: profileMap[order.user_id] || null,
      }));

      setOrders(enriched);
    } catch (e: any) {
      console.error("Failed to load print orders:", e);
      if (!isBackground) {
        setDbError(e.message || "Unknown database error");
        toast.error("Failed to load print orders.");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-print-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => load(true))
      .subscribe();

    pollIntervalRef.current = setInterval(() => load(true), 15000);

    return () => {
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [load]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const { error } = await (supabase as any).from("print_orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      
      // Trigger Push Notification to Customer
      await notifyCustomerOrder(orderToUpdate.user_id, orderId, newStatus, true);

      toast.success(`Print order ${newStatus}! Notification sent.`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
      load();
    }
  };

  const filtered = orders.filter(o => {
    const cust = o.customer;
    const custName = cust ? `${cust.first_name} ${cust.last_name}` : "";
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || 
      custName.toLowerCase().includes(search.toLowerCase()) ||
      (o.file_name || "").toLowerCase().includes(search.toLowerCase());
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
    const cust = selectedOrder.customer;
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
              'bg-primary/20 text-primary'
            }`}>{selectedOrder.status.toUpperCase()}</span>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Information</p>
            <p className="text-xs font-bold">{cust ? `${cust.first_name} ${cust.last_name}` : "Unknown"}</p>
            <p className="text-[10px] text-muted-foreground">{cust?.grade_level} • {cust?.section}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => window.open(selectedOrder.file_url, '_blank')} className="w-full gap-1">
              <Download className="h-4 w-4" /> Download
            </Button>
            {selectedOrder.status === "pending" && (
              <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "approved")} className="flex-1">Approve</Button>
            )}
            {selectedOrder.status === "approved" && (
              <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "completed")} className="flex-1">Complete</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(o => (
          <div key={o.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs truncate">{o.file_name}</p>
              <p className="text-[10px] text-muted-foreground">{o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : 'Unknown'}</p>
            </div>
            <button onClick={() => setSelectedOrder(o)} className="p-1.5 rounded-lg bg-muted"><Eye className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}