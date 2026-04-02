import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, Clock, CheckCircle2, XCircle, Truck, Download, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderReceipt from "@/components/OrderReceipt";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-warning", label: "Pending Approval" },
  approved: { icon: CheckCircle2, color: "text-[hsl(var(--success))]", label: "Approved" },
  ready: { icon: Truck, color: "text-primary", label: "Ready for Pickup" },
  completed: { icon: CheckCircle2, color: "text-[hsl(var(--success))]", label: "Completed" },
  rejected: { icon: XCircle, color: "text-destructive", label: "Rejected" },
  canceled: { icon: XCircle, color: "text-destructive", label: "Canceled" },
};

const printStatusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-warning/20 text-warning", label: "Pending" },
  approved: { color: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]", label: "Approved" },
  confirmed: { color: "bg-primary/20 text-primary", label: "Confirmed" },
  rejected: { color: "bg-destructive/20 text-destructive", label: "Rejected" },
  canceled: { color: "bg-destructive/20 text-destructive", label: "Canceled" },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [printOrders, setPrintOrders] = useState<any[]>([]);
  const [receiptOrder, setReceiptOrder] = useState<any>(null);

  // Load product orders
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setOrders(data || []));
  }, [user]);

  // Load print orders
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("print_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setPrintOrders(data || []));
  }, [user]);

  // Realtime for orders
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => {
          (supabase as any)
            .from("orders")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .then(({ data }: any) => setOrders(data || []));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Realtime for print orders
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("my-print-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders", filter: `user_id=eq.${user.id}` },
        () => {
          (supabase as any)
            .from("print_orders")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .then(({ data }: any) => setPrintOrders(data || []));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">My Orders</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to view orders.</p>
          <Button onClick={() => window.location.href = "/login"}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="font-extrabold text-lg text-secondary">My Orders</h1>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-3">
            <TabsTrigger value="products" className="text-xs gap-1">
              <Package className="h-3.5 w-3.5" /> Products
            </TabsTrigger>
            <TabsTrigger value="print" className="text-xs gap-1">
              <Printer className="h-3.5 w-3.5" /> Print Requests
            </TabsTrigger>
          </TabsList>

          {/* Product Orders Tab */}
          <TabsContent value="products">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  const items = order.items || [];
                  return (
                    <div key={order.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          #{order.id.slice(0, 8)}
                        </span>
                        <div className={`flex items-center gap-1 ${cfg.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold">{cfg.label}</span>
                        </div>
                      </div>
                      <div className="px-3 py-2 space-y-2">
                        {items.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            {item.image && <img src={item.image} className="h-10 w-10 rounded-lg object-cover" alt="" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">₱{item.price} × {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <p className="text-[10px] text-muted-foreground">+{items.length - 3} more items</p>
                        )}
                      </div>
                      {order.delivery_type && (
                        <div className="px-3 py-1 border-t border-border bg-muted/20">
                          <p className="text-[10px] text-muted-foreground">
                            {order.delivery_type === 'delivery' ? '🚚 Delivery' : '📦 Pickup'} — {order.pickup_date} at {order.pickup_time}
                            {Number(order.delivery_fee) > 0 && ` • +₱${Number(order.delivery_fee)} fee`}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-3">
                          {order.status === "completed" && (
                            <button
                              onClick={() => setReceiptOrder(order)}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg active:scale-95 transition-transform"
                            >
                              <Download className="h-3 w-3" /> Receipt
                            </button>
                          )}
                          <span className="text-[10px] text-primary font-bold">+{Number(order.bcoins_earned).toFixed(1)} BCoins</span>
                          <span className="font-extrabold text-sm text-secondary">₱{Number(order.total).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Print Orders Tab */}
          <TabsContent value="print">
            {printOrders.length === 0 ? (
              <div className="text-center py-12">
                <Printer className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No print requests yet</p>
                <Button size="sm" className="mt-3" onClick={() => window.location.href = "/print"}>
                  Submit a Print Request
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {printOrders.map((order) => {
                  const cfg = printStatusConfig[order.status] || printStatusConfig.pending;
                  return (
                    <div key={order.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-xs font-bold truncate">{order.file_name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="px-3 py-2">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="bg-muted rounded-lg p-1.5">
                            <span className="text-sm font-extrabold text-foreground block">{order.total_pages}</span>
                            <span className="text-[9px] text-muted-foreground">Total</span>
                          </div>
                          <div className="bg-muted rounded-lg p-1.5">
                            <span className="text-sm font-extrabold text-foreground block">{order.bw_pages}</span>
                            <span className="text-[9px] text-muted-foreground">B&W</span>
                          </div>
                          <div className="bg-muted rounded-lg p-1.5">
                            <span className="text-sm font-extrabold text-foreground block">{order.colored_pages}</span>
                            <span className="text-[9px] text-muted-foreground">Colored</span>
                          </div>
                          <div className="bg-muted rounded-lg p-1.5">
                            <span className="text-sm font-extrabold text-foreground block">{order.page_size?.toUpperCase()}</span>
                            <span className="text-[9px] text-muted-foreground">Size</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-extrabold text-sm text-primary">₱{Number(order.cost).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {receiptOrder && (
        <OrderReceipt order={receiptOrder} onClose={() => setReceiptOrder(null)} />
      )}

      <BottomNav />
    </div>
  );
}
