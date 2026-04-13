import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Truck, MapPin, User, Eye, Loader2, RefreshCw, AlertCircle, FileText, Palette, File, Download } from "lucide-react";
import { sendNotification } from "@/lib/notifications";

export default function PrintTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadOrders = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
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
          .select("user_id, first_name, last_name, grade_level, section, email")
          .in("user_id", userIds);

        if (profiles) {
          profiles.forEach((p: any) => { profileMap[p.user_id] = p; });
        }
      }

      const enriched = await Promise.all(
        (printData || []).map(async (order: any) => {
          const customer = profileMap[order.user_id] || null;
          return {
            ...order,
            customer,
          };
        })
      );

      setOrders(enriched);
    } catch (e: any) {
      console.error("Failed to load print orders:", e);
      if (!isBackground) {
        toast.error("Failed to load print orders. Check console for details.");
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-print-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => {
        loadOrders(true);
      })
      .subscribe();

    pollIntervalRef.current = setInterval(() => {
      loadOrders(true);
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [loadOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const { data: order } = await (supabase as any).from("print_orders").select("*").eq("id", orderId).maybeSingle();
      if (!order) {
        toast.error("Order not found");
        return;
      }

      const { error } = await (supabase as any).from("print_orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;

      await sendNotification({
        title: `🖨️ Print Request ${newStatus.toUpperCase()}`,
        message: `Your print request for "${order.file_name}" is now ${newStatus}.`,
        type: "print_status",
        userId: order.user_id,
        link: "/orders",
        icon: "🖨️",
        sendPush: true
      });

      toast.success(`Print order ${newStatus}! Notification sent.`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
      loadOrders();
    }
  };

  const filtered = orders.filter(o => {
    const cust = o.customer;
    const custName = cust ? `${cust.first_name} ${cust.last_name}` : "";
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch =
      !search ||
      custName.toLowerCase().includes(search.toLowerCase()) ||
      (o.file_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (cust?.section || "").toLowerCase().includes(search.toLowerCase()) ||
      (cust?.grade_level || "").toLowerCase().includes(search.toLowerCase());
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
    const custName = cust ? `${cust.first_name} ${cust.last_name}` : "Unknown User";
    const custEmail = cust?.email || "N/A";
    const custGrade = cust?.grade_level || "N/A";
    const custSection = cust?.section || "N/A";
    const isPrint = selectedOrder.type === 'print';

    // Get the selected paper size
    const selectedPaperSize = selectedOrder.page_size || "a4";

    // Get the actual page numbers selected by the customer
    const selectedPages = selectedOrder.selected_pages || [];

    // Get the number of copies
    const copies = selectedOrder.copies || 1;

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
              selectedOrder.status === 'approved' ? 'bg-primary/20 text-primary' :
              'bg-muted text-muted-foreground'
            }`}>{selectedOrder.status.toUpperCase()}</span>
          </div>

          {/* Customer Information - Enhanced */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Information</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{custName}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{custEmail}</p>
            <p className="text-[10px] text-muted-foreground">{custGrade} • {custSection}</p>
          </div>

          {/* Delivery Information */}
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

          {/* Copies Information - NEW */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Number of Copies</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">{copies}</span>
              <span className="text-[10px] text-muted-foreground">copies selected</span>
            </div>
          </div>

          {/* Print Details - Enhanced */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Print Details</p>

            {/* Paper Size Selection - Now prominently displayed */}
            <div className="bg-background rounded-lg p-3 border border-border">
              <p className="text-xs font-bold text-primary mb-2">Selected Paper Size</p>
              <div className="flex items-center gap-2">
                {selectedPaperSize === "short" && (
                  <span className="text-sm font-bold text-blue-600">📄 Short</span>
                )}
                {selectedPaperSize === "a4" && (
                  <span className="text-sm font-bold text-green-600">📄 A4</span>
                )}
                {selectedPaperSize === "long" && (
                  <span className="text-sm font-bold text-red-600">📄 Long</span>
                )}
              </div>
            </div>

            {/* Selected Pages - Show actual page numbers */}
            {selectedPages && selectedPages.length > 0 ? (
              <div className="bg-background rounded-lg p-3 border border-border">
                <p className="text-xs font-bold text-primary mb-2">Pages to Print</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPages.map((pageNum: number, index: number) => (
                    <span key={index} className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                      Page {pageNum}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No pages selected</p>
            )}

            {/* Total Pages */}
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>Total Pages: {selectedOrder.total_pages}</span>
            </div>

            {/* Color Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-background rounded-lg p-2">
                <span className="text-sm font-extrabold block">{selectedOrder.bw_pages || 0}</span>
                <span className="text-[9px] text-muted-foreground">Black & White</span>
              </div>
              <div className="bg-background rounded-lg p-2">
                <span className="text-sm font-extrabold block">{selectedOrder.colored_pages || 0}</span>
                <span className="text-[9px] text-muted-foreground">Color</span>
              </div>
            </div>

            {/* Cost */}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-xs font-bold">Total Cost</span>
              <span className="text-sm font-extrabold text-primary">₱{Number(selectedOrder.cost || 0).toFixed(2)}</span>
            </div>
          </div>

          {selectedOrder.file_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(selectedOrder.file_url, '_blank')}
              className="gap-1 w-full"
            >
              <Download className="h-4 w-4" />
              Download File
            </Button>
          )}

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
            {["pending", "approved"].includes(selectedOrder.status) && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(selectedOrder.id, "canceled")} className="gap-1 w-full"><XCircle className="h-3 w-3" /> Cancel</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
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
        <Button size="sm" variant="outline" onClick={() => loadOrders(true)} disabled={refreshing}>
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search print orders..." className="pl-9 text-xs h-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(o => (
            <div key={o.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-bold text-xs truncate">{o.file_name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {o.customer ? `${o.customer.first_name} ${o.customer.last_name}` : 'Unknown'} • ₱{Number(o.cost || 0).toFixed(2)}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {o.customer?.grade_level} • {o.customer?.section}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  o.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                  o.status === 'pending' ? 'bg-warning/20 text-warning' :
                  o.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                  'bg-primary/20 text-primary'
                }`}>{o.status}</span>
                <button onClick={() => setSelectedOrder(o)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No print orders found</p>}
        </div>
      )}
    </div>
  );
}