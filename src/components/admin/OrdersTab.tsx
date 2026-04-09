import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Truck, Package, Eye, ShoppingCart, Printer, Loader2, RefreshCw, User, MapPin, FileText } from "lucide-react";
import { notifyCustomerOrder, notifyCustomerBCoins } from "@/lib/notifications";

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
      const { data: ordersRes, error: ordersError } = await (supabase as any)
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const { data: printRes, error: printError } = await (supabase as any)
        .from("print_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (printError) throw printError;

      const combined = [...(ordersRes || [])];
      const printData = printRes || [];

      const userIds = new Set<string>();
      combined.forEach((o: any) => { if (o.user_id) userIds.add(o.user_id); });
      printData.forEach((o: any) => { if (o.user_id) userIds.add(o.user_id); });

      let profileMap: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, first_name, last_name, section, grade_level")
          .in("user_id", Array.from(userIds));
        
        if (profiles) {
          profiles.forEach((p: any) => { profileMap[p.user_id] = p; });
        }
      }

      const ordersWithProfile = combined.map((order: any) => ({
        ...order,
        customer: profileMap[order.user_id] || null,
        type: 'product'
      }));

      const printEnriched = printData.map((order: any) => ({
        ...order,
        customer: profileMap[order.user_id] || null,
        type: 'print'
      }));

      setOrders([...ordersWithProfile, ...printEnriched]);
    } catch (e: any) {
      console.error("Failed to load orders:", e);
      if (showToast) toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!isAuthReady || !isAdmin) return;
    
    const channel = supabase
      .channel("admin-pending-counts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadPendingCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => loadPendingCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "gcash_transactions" }, () => loadPendingCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_redemptions" }, () => loadPendingCounts())
      .subscribe();
      
    pendingPollRef.current = setInterval(() => {
      loadPendingCounts();
    }, 5000);
      
    return () => {
      supabase.removeChannel(channel);
      if (pendingPollRef.current) clearInterval(pendingPollRef.current);
    };
  }, [isAuthReady, isAdmin, loadPendingCounts]);

  const availableTabs = getAvailableTabs(isMainAdmin, pendingCounts);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="mb-6">
          <h1 className="font-extrabold text-xl text-foreground">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            {isMainAdmin ? "👑 Main Admin" : "🛡️ Member Admin"} • {profile?.email}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 lg:grid-cols-7 h-auto mb-6 bg-muted/50 p-1 rounded-xl">
            {availableTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center gap-1 text-[10px] font-medium transition-all hover:bg-primary/10"
              >
                <div className="relative">
                  {tab.icon}
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full h-3.5 min-w-3.5">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="sellers"><SellersTab /></TabsContent>
          <TabsContent value="print"><PrintTab /></TabsContent>
          <TabsContent value="messages"><MessagesTab /></TabsContent>
          <TabsContent value="codes"><CodesTab /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
          <TabsContent value="banners"><BannerTab /></TabsContent>
          <TabsContent value="club"><ClubTab /></TabsContent>
          <TabsContent value="bcoins"><BCoinsTab /></TabsContent>
          <TabsContent value="gcash"><GCashTab /></TabsContent>
          {isMainAdmin ? (
            <TabsContent value="settings"><SettingsTab /></TabsContent>
          ) : (
            <TabsContent value="settings"><MemberAdminSettingsTab /></TabsContent>
          )}
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );