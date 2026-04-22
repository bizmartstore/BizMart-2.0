import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Users, ShoppingCart, Printer, DollarSign, Clock, LayoutDashboard, ShieldCheck, Settings2 } from "lucide-react";

export default function OverviewTab() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalPrintOrders: 0,
    pendingPrintOrders: 0,
    completedPrintOrders: 0,
    printRevenue: 0,
    totalSellers: 0,
    totalClubMembers: 0,
    totalGCashTransactions: 0,
    pendingGCashTransactions: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      // Orders stats (product orders)
      const { data: orders } = await (supabase as any).from("orders").select("status, total");
      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o: any) => o.status === "pending").length || 0;
      const completedOrders = orders?.filter((o: any) => o.status === "completed").length || 0;
      const ordersRevenue = orders?.filter((o: any) => o.status === "completed").reduce((sum: number, o: any) => sum + Number(o.total || 0), 0) || 0;

      // Print orders stats
      const { data: printOrders } = await (supabase as any).from("print_orders").select("status, cost");
      const totalPrintOrders = printOrders?.length || 0;
      const pendingPrintOrders = printOrders?.filter((o: any) => o.status === "pending").length || 0;
      const completedPrintOrders = printOrders?.filter((o: any) => o.status === "completed").length || 0;
      const printRevenue = printOrders?.filter((o: any) => o.status === "completed").reduce((sum: number, o: any) => sum + Number(o.cost || 0), 0) || 0;

      // Users
      const { count: totalUsers } = await (supabase as any).from("profiles").select("*", { count: "exact", head: true });

      // Sellers
      const { count: totalSellers } = await (supabase as any).from("seller_profiles").select("*", { count: "exact", head: true }).eq("is_active", true);

      // Club members
      const { count: totalClubMembers } = await (supabase as any).from("club_memberships").select("*", { count: "exact", head: true }).eq("status", "active");

      // GCash
      const { data: gcashTxns } = await (supabase as any).from("gcash_transactions").select("status");
      const totalGCashTransactions = gcashTxns?.length || 0;
      const pendingGCashTransactions = gcashTxns?.filter((t: any) => t.status === "pending").length || 0;

      // Recent activity - combine orders and print orders
      const [recentOrdersData, recentPrintData] = await Promise.all([
        (supabase as any).from("orders").select("*").order("created_at", { ascending: false }).limit(3),
        (supabase as any).from("print_orders").select("*").order("created_at", { ascending: false }).limit(3),
      ]);

      const combined = [
        ...(recentOrdersData.data || []).map((o: any) => ({ ...o, type: 'order' })),
        ...(recentPrintData.data || []).map((p: any) => ({ ...p, type: 'print' })),
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: ordersRevenue + printRevenue,
        totalUsers: totalUsers || 0,
        totalPrintOrders,
        pendingPrintOrders,
        completedPrintOrders,
        printRevenue,
        totalSellers: totalSellers || 0,
        totalClubMembers: totalClubMembers || 0,
        totalGCashTransactions,
        pendingGCashTransactions,
      });
      setRecentOrders(combined);
    } catch (e) {
      console.error("Failed to load stats:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Real-time subscriptions for all stats tables
  useEffect(() => {
    const channel = supabase
      .channel("admin-overview-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => {
        loadStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "gcash_transactions" }, () => {
        loadStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_redemptions" }, () => {
        loadStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        loadStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "seller_profiles" }, () => {
        loadStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "club_memberships" }, () => {
        loadStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadStats]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-bold text-muted-foreground">Product Orders</span>
          </div>
          <p className="text-2xl font-extrabold">{stats.totalOrders}</p>
          <p className="text-[10px] text-muted-foreground">{stats.pendingOrders} pending</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Printer className="h-5 w-5 text-purple-500" />
            <span className="text-xs font-bold text-muted-foreground">Print Orders</span>
          </div>
          <p className="text-2xl font-extrabold">{stats.totalPrintOrders}</p>
          <p className="text-[10px] text-muted-foreground">{stats.pendingPrintOrders} pending</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-xs font-bold text-muted-foreground">Total Revenue</span>
          </div>
          <p className="text-2xl font-extrabold">₱{stats.totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Products + Print</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-cyan-500" />
            <span className="text-xs font-bold text-muted-foreground">Users</span>
          </div>
          <p className="text-2xl font-extrabold">{stats.totalUsers}</p>
          <p className="text-[10px] text-muted-foreground">{stats.totalClubMembers} club members</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-lg font-extrabold text-primary">{stats.totalSellers}</p>
          <p className="text-[10px] text-muted-foreground font-bold">Active Sellers</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-lg font-extrabold text-[hsl(var(--success))]">{stats.totalGCashTransactions}</p>
          <p className="text-[10px] text-muted-foreground font-bold">GCash Transactions</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-lg font-extrabold text-warning">{stats.completedOrders + stats.completedPrintOrders}</p>
          <p className="text-[10px] text-muted-foreground font-bold">Completed</p>
        </div>
      </div>

      {/* Print Service Stats */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Printer className="h-4 w-4 text-purple-500" /> Print Service Statistics
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xl font-extrabold text-foreground">{stats.totalPrintOrders}</p>
            <p className="text-[10px] text-muted-foreground">Total Print Orders</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xl font-extrabold text-warning">{stats.pendingPrintOrders}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xl font-extrabold text-[hsl(var(--success))]">{stats.completedPrintOrders}</p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xl font-extrabold text-primary">₱{stats.printRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Print Revenue</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" /> Recent Activity
        </h3>
        {recentOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((item: any, idx: number) => {
              const isPrint = item.type === 'print';
              const isOrder = item.type === 'order';
              
              return (
                <div key={`${item.type}-${item.id}-${idx}`} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {isPrint && <Printer className="h-4 w-4 text-purple-500" />}
                    {isOrder && <Package className="h-4 w-4 text-secondary" />}
                    <div>
                      <p className="text-xs font-bold">
                        {isPrint ? `Print: ${item.file_name}` : `Order: ${item.customer_name || 'Customer'}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        #{item.id.slice(0, 8)} • {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">₱{Number(item.total || item.cost || 0).toFixed(2)}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.status === 'completed' || item.status === 'confirmed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                      item.status === 'pending' ? 'bg-warning/20 text-warning' :
                      item.status === 'rejected' || item.status === 'canceled' ? 'bg-destructive/20 text-destructive' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}