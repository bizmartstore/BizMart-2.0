import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { OrderStatus } from "@/types/admin"; // Assuming you have a type definition for order statuses

export default function SellerOrdersTab({ user }: { user: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "approved" | "completed">("all");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("products").select("id, name").eq("seller_id", user.id)
      .then(({ data }: any) => {
        setProducts(data || []);
        const productIds = (data || []).map((p: any) => p.id);
        if (productIds.length === 0) {
          setOrders([]);
          return;
        }

        (supabase as any).from("orders").select("*")
          .eq("seller_id", user.id)
          .in("status", ["approved", "completed"])
          .order("created_at", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(100)
          .then(({ data: orderData }: any) => setOrders(orderData || []));
      });
  }, [user]);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const totalSales = filtered.reduce((sum, o) => sum + Number(o.total), 0);
  const sellerEarnings = filtered.reduce((sum, o) => sum + Number(o.seller_earnings || 0), 0);
  const totalOrders = filtered.length;
  const completedOrders = filtered.filter(o => o.status === "completed").length;

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-primary/10 to-accent rounded-xl p-3 border border-primary/20 text-center">
          <p className="text-xl font-extrabold text-primary">₱{totalSales.toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground font-bold">Total Sales</p>
        </div>
        <div className="bg-gradient-to-br from-[hsl(var(--success))]/10 to-[hsl(var(--success))]/5 rounded-xl p-3 border border-[hsl(var(--success))]/20 text-center">
          <p className="text-xl font-extrabold text-[hsl(var(--success))]">₱{sellerEarnings.toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground font-bold">Your Earnings (80%)</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5">
        {(["all", "approved", "completed"] as const).map(key => (
          <button            key={key}
            onClick={() => setFilter(key)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${filter === key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}
          >
            {key === "all" ? "All" : key === "approved" ? "Approved" : "Completed"}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <p className="font-bold text-sm">Orders ({filtered.length})</p>
      {filtered.map(order => {
        const items = filtered.filter(o => o.status === "completed" && o.id === order.id);
        const myProductIds = products.map((p: any) => p.id);
        const myItems = filtered.filter(o => myProductIds.includes(o.id));
        const itemsTotal = myItems.reduce((sum, o: any) => sum + (Number(o.total || 0)), 0);

        return (
          <div key={order.id} className="bg-card rounded-xl p-3 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                {order.customer_name && (
                  <span className="text-[10px] text-foreground font-bold ml-2">
                    {order.customer_name}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-primary/20 text-primary'}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <div className="text-right">
                <span className="font-bold text-sm text-primary">₱{Number(order.total).toFixed(2)}</span>
                <p className="text-[9px] text-[hsl(var(--success))] font-bold">Earned: ₱{Number(order.seller_earnings || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}