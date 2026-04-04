import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Store, CheckCircle2, XCircle, RefreshCw, AlertCircle, MapPin, Download, User, Truck } from "lucide-react";

export default function PrintTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data: orders, error } = await (supabase as any).from("print_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(orders || []);
    } catch (e: any) {
      console.error("Failed to load print orders:", e);
      setDbError(e.message || "Unknown database error");
      toast.error("Failed to load print orders. Check console for details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  if (selectedOrder) {
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedOrder(null)} className="text-xs text-primary font-bold">← Back to Print Orders</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">{selectedOrder.file_name}</h3>
              <p className="text-[10px] text-muted-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              selectedOrder.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
              selectedOrder.status === 'pending' ? 'bg-warning/20 text-warning' :
              selectedOrder.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
              selectedOrder.status === 'approved' ? 'bg-primary/20 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {selectedOrder.status.toUpperCase()}
            </span>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Information</p>
            <p className="text-xs font-bold text-foreground">{selectedOrder.customer_name || "Unknown"}</p>
            <p className="text-[10px] text-muted-foreground">{selectedOrder.customer_email || "N/A"}</p>
            <p className="text-[10px] text-muted-foreground">{selectedOrder.customer_grade || "N/A"} • {selectedOrder.customer_section || "N/A"}</p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold capitalize">{selectedOrder.delivery_type || 'pickup'}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {selectedOrder.pickup_date || "N/A"} at {selectedOrder.pickup_time || "N/A"}
            </span>
          </div>

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
            {selectedOrder.file_url && (
              <a 
                href={selectedOrder.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-bold py-2 px-3 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="h-3 w-3" /> Download File
              </a>
            )}
            {selectedOrder.status === "pending" && (
              <>
                <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "approved")} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
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
      {dbError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-destructive">Database Error</p>
            <p className="text-[10px] text-destructive/80 mt-0.5">{dbError}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search by name, file, or section..." 
          className="pl-9 text-xs h-9" 
        />
      </div>

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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(order => (
            <div key={order.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Store className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-bold text-xs truncate">{order.file_name}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                  order.status === 'pending' ? 'bg-warning/20 text-warning' :
                  order.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                  order.status === 'approved' ? 'bg-primary/20 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2 text-[10px] text-muted-foreground">
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="font-bold text-foreground">{order.customer_name || "Unknown"}</span>
                <span>•</span>
                <span>{order.customer_grade || "N/A"} - {order.customer_section || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {order.delivery_type === 'delivery' ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                  <span className="capitalize">{order.delivery_type || 'pickup'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {order.pickup_date || "N/A"} at {order.pickup_time || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-right">
                    <span className="font-bold text-sm text-primary">₱{Number(order.cost).toFixed(2)}</span>
                    <p className="text-[9px] text-muted-foreground">
                      {order.total_pages}pg ({order.bw_pages}B/{order.colored_pages}C)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>
          )}
        </div>
      </div>
    </div>
  );
}