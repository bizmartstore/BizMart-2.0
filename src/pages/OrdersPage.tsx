import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Package, Printer, Clock, CheckCircle2, XCircle, Truck, AlertCircle } from "lucide-react";
import OrderReceipt from "@/components/OrderReceipt";

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [printOrders, setPrintOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: o } = await (supabase as any).from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setOrders(o || []);
      const { data: p } = await (supabase as any).from("print_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setPrintOrders(p || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("orders-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("print-orders-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders", filter: `user_id=eq.${user.id}` }, () => loadData())
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
          <p className="text-sm text-muted-foreground mb-6">Please login to view your orders.</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const allOrders = [
    ...orders.map(o => ({ ...o, type: 'product' })),
    ...printOrders.map(p => ({ ...p, type: 'print' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const statusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'ready': return <Truck className="h-4 w-4 text-[hsl(var(--success))]" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />;
      case 'rejected': case 'canceled': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <h1 className="font-extrabold text-lg mb-4">My Orders</h1>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : allOrders.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
            <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No orders yet</p>
            <Button onClick={() => navigate("/")} className="mt-4">Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {allOrders.map(order => (
              <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-card rounded-xl p-3 border border-border active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {order.type === 'print' ? <Printer className="h-4 w-4 text-purple-500" /> : <Package className="h-4 w-4 text-primary" />}
                    <span className="text-xs font-bold text-foreground">
                      {order.type === 'print' ? `Print: ${order.file_name}` : `Order #${order.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(order.status)}
                    <span className="text-[10px] font-bold capitalize">{order.status}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                  <span className="text-sm font-extrabold text-primary">₱{Number(order.total || order.cost || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedOrder && <OrderReceipt order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      <BottomNav />
    </div>
  );
}