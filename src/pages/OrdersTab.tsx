import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      const { data: ordersRes, error: ordersError } = await (
        supabase as any      ).from("orders").select("*").order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const { data: printRes, error: printError } = await (
        supabase as any
      ).from("print_orders").select("*").order("created_at", { ascending: false });

      if (printError) throw printError;

      const combined = [
        ...ordersRes,
        ...printRes,
      }.map((o) => ({
        ...o,
        type: o.type === "print" ? "print" : "order",
      }));

      setOrders(combined);
    } catch (e: any) {
      console.error("Failed to load orders:", e);
      if (showToast) toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase.channel("admin-orders-realtime").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => loadOrders(true)
    }).on(
      "postgres_changes",
      { event: "*", schema: "public", table: "print_orders" },
      () => loadOrders(true)
    ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => loadOrders(true), 15000);
    return () => clearInterval(pollIntervalRef.current);
  }, [loadOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const isPrint = selectedOrder?.type === "print";
      const table = isPrint ? "print_orders" : "orders";

      const { error } = await (supabase as any).from(table).update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;

      // Notify the customer about status change
      await notifyCustomerOrder(orderId, newStatus);

      toast.success(`Order ${newStatus}! Notification sent to customer.`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
      loadOrders();
    }
  };

  const notifyCustomerOrder = async (orderId: string, newStatus: string) => {
    // Insert a notification log so the UI grid can pick it up
    const { data: log, error: logErr } = await supabase
      .from("notification_logs")
      .insert({
        title: "Order Status Update",
        message: `Order #${orderId} is now ${newStatus}`,
        type: "order_status",
        user_id: null, // will be filled by trigger logic if needed
        link: "/orders",
        icon: "📦",
      })
      .select()
      .single();

    if (logErr) throw logErr;

    // Forward to realtime channel so UI updates automatically
    // (the UI already listens on "notification_logs" changes)
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statusCounts: Record<string, number> = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    approved: orders.filter((o) => o.status === "approved").length,
    completed: orders.filter((o) => o.status === "completed").length,
    rejected: orders.filter((o) => o.status === "rejected").length,
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
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map((o) => (
            <div key={o.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {o.type === "print" ? <Printer className="h-4 w-4 text-purple-500" /> : <Package className="h-4 w-4 text-primary" />}
                  <span className="font-bold text-xs text-foreground truncate">
                    {o.type === "print" ? `Print: ${o.file_name}` : `Order #${o.id.slice(0, 8)}`}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : "Unknown"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  o.status === "completed"
                    ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
                    : o.status === "pending"
                      ? "bg-warning/20 text-warning"
                      : "bg-destructive/20 text-destructive"
                    }">
                  {o.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(o)}
                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"
              >
                <XCircle className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="bg-card rounded-xl border border-border p-4">
          {/* ... existing selected order UI ... */}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-8">
          No orders found
        </p>
      )}
    </div>
  );
}