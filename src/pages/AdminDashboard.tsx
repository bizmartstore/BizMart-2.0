import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, ShoppingCart, Printer, MessageCircle, Crown, Coins, Settings, BarChart3, Bell, Ticket, Award, Store, FolderOpen, Megaphone, Users as UsersIcon, ClipboardList } from "lucide-react";
import OverviewTab from "@/components/admin/OverviewTab";
import OrdersTab from "@/components/admin/OrdersTab";
import ProductsTab from "@/components/admin/ProductsTab";
import CategoriesTab from "@/components/admin/CategoriesTab";
import UsersTab from "@/components/admin/UsersTab";
import PrintTab from "@/components/admin/PrintTab";
import MessagesTab from "@/components/admin/AdminMessagesTab";
import CodesTab from "@/components/admin/CodesTab";
import RegistrationCodesTab from "@/components/admin/RegistrationCodesTab";
import NewsTab from "@/components/admin/NewsTab";
import ClubTab from "@/components/admin/ClubTab";
import BCoinsTab from "@/components/admin/BCoinsTab";
import GCashTab from "@/components/admin/GCashTab";
import SellersTab from "@/components/admin/SellersTab";
import SettingsTab from "@/components/admin/SettingsTab";
import MemberAdminSettingsTab from "@/components/admin/MemberAdminSettingsTab";
import BannerTab from "@/components/admin/BannerTab";
import BroadcastTab from "@/components/admin/BroadcastTab";
const getAvailableTabs = (isMainAdmin: boolean, pendingCounts: any) => {
  const baseTabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" />, badge: null },
    { id: "orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4" />, badge: pendingCounts.orders > 0 ? pendingCounts.orders : null },
    { id: "products", label: "Products", icon: <Package className="h-4 w-4" />, badge: null },
    { id: "broadcast", label: "Broadcast", icon: <Megaphone className="h-4 w-4" />, badge: null },
    { id: "categories", label: "Categories", icon: <FolderOpen className="h-4 w-4" />, badge: null },
    { id: "users", label: "Users", icon: <Users className="h-4 w-4" />, badge: null },
    { id: "sellers", label: "Sellers", icon: <Store className="h-4 w-4" />, badge: null },
    { id: "print", label: "Print", icon: <Printer className="h-4 w-4" />, badge: pendingCounts.print > 0 ? pendingCounts.print : null },
    { id: "messages", label: "Messages", icon: <MessageCircle className="h-4 w-4" />, badge: null },
    { id: "codes", label: "Codes", icon: <Ticket className="h-4 w-4" />, badge: null },
    { id: "registration-codes", label: "Registration Codes", icon: <Ticket className="h-4 w-4" />, badge: null },
    { id: "news", label: "News", icon: <Bell className="h-4 w-4" />, badge: null },
    { id: "banners", label: "Banners", icon: <Award className="h-4 w-4" />, badge: null },
    { id: "club", label: "Club", icon: <Crown className="h-4 w-4" />, badge: null },
    { id: "bcoins", label: "BCoins", icon: <Coins className="h-4 w-4" />, badge: pendingCounts.bcoins > 0 ? pendingCounts.bcoins : null },
    { id: "gcash", label: "GCash", icon: <Bell className="h-4 w-4" />, badge: pendingCounts.gcash > 0 ? pendingCounts.gcash : null },
    { id: "pos", label: "POS", icon: <ClipboardList className="h-4 w-4" />, badge: null },
  ];

  if (isMainAdmin) {
    baseTabs.push({ id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" />, badge: null });
  }

  return baseTabs;
};

export default function AdminDashboard() {
  const { user, profile, isAuthReady } = useAuth();
  const { isAdmin, isMainAdmin } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingCounts, setPendingCounts] = useState({
    orders: 0,
    print: 0,
    gcash: 0,
    bcoins: 0,
    messages: 0,
  });
  const pendingPollRef = useRef<NodeJS.Timeout | null>(null);

  const loadPendingCounts = useCallback(async () => {
    try {
      const [ordersRes, printRes, gcashRes, bcoinsRes] = await Promise.allSettled([
        (supabase as any).from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("print_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("gcash_transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("bcoins_redemptions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      
      setPendingCounts({
        orders: ordersRes.status === "fulfilled" ? (ordersRes.value.count || 0) : 0,
        print: printRes.status === "fulfilled" ? (printRes.value.count || 0) : 0,
        gcash: gcashRes.status === "fulfilled" ? (gcashRes.value.count || 0) : 0,
        bcoins: bcoinsRes.status === "fulfilled" ? (bcoinsRes.value.count || 0) : 0,
        messages: 0,
      });
    } catch (e) {
      console.error("Failed to load pending counts:", e);
    }
  }, []);

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      loadPendingCounts();
    }
  }, [isAuthReady, isAdmin, loadPendingCounts]);

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
          <TabsList className="w-full grid grid-cols-4 lg:grid-cols-8 h-auto mb-6 bg-muted/50 p-1 rounded-xl">
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
          <TabsContent value="broadcast"><BroadcastTab /></TabsContent>
          <TabsContent value="categories"><CategoriesTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="sellers"><SellersTab /></TabsContent>
          <TabsContent value="print"><PrintTab /></TabsContent>
          <TabsContent value="messages"><MessagesTab /></TabsContent>
          <TabsContent value="codes"><CodesTab /></TabsContent>
          <TabsContent value="registration-codes"><RegistrationCodesTab /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
          <TabsContent value="banners"><BannerTab /></TabsContent>
          <TabsContent value="club"><ClubTab /></TabsContent>
          <TabsContent value="bcoins"><BCoinsTab /></TabsContent>
          <TabsContent value="gcash"><GCashTab /></TabsContent>
          <TabsContent value="pos"><div className="p-4"><h2 className="text-xl font-bold mb-4">POS System</h2><p className="text-sm text-muted-foreground">Access the POS system at <a href="/pos" className="text-primary underline">/pos</a></p></div></TabsContent>
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
}