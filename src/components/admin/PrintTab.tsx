import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Store, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";

export default function PrintTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: orders, error } = await (supabase as any).from("print_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(orders || []);
    } catch (e: any) {
      console.error("Failed to load print orders:", e);
      toast.error("Failed to load print orders: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-print-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => prev ? { ...prev, status: status } : null);
    }

    try {
      await (supabase as any).from("print_orders").update({ status: status }).eq("id", id);
      toast.success(`Print order ${status}!`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || 
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.file_name || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => o.status === "approved").length,
    rejected: orders.filter(o => o.status === "rejected").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
              filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Button size="sm" variant="outline" onClick={load} disabled={refreshing} className="gap-1">
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(order => (
            <div key={order.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-bold text-xs">{order.file_name}</p>
                    <p className="text-[10px] text-muted-foreground">{order.customer_name}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                  order.status === 'pending' ? 'bg-warning/20 text-warning' :
                  order.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                  'bg-primary/20 text-primary'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>
          )}
        </div>
      </div>
    </div>
  );
}