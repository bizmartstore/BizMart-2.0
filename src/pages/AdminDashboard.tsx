import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Package, ShoppingCart, Printer, MessageCircle,
  Crown, Coins, Settings, BarChart3, Bell, Briefcase, Ticket, Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import OverviewTab from "@/components/admin/OverviewTab";
import OrdersTab from "@/components/admin/OrdersTab";
import ProductsTab from "@/components/admin/ProductsTab";
import UsersTab from "@/components/admin/UsersTab";
import PrintTab from "@/components/admin/PrintTab";
import MessagesTab from "@/components/admin/AdminMessagesTab";
import CodesTab from "@/components/admin/CodesTab";
import NewsTab from "@/components/admin/NewsTab";
import ClubTab from "@/components/admin/ClubTab";
import BCoinsTab from "@/components/admin/BCoinsTab";
import GCashTab from "@/components/admin/GCashTab";
import SellersTab from "@/components/admin/SellersTab";
import JobsTab from "@/components/admin/JobsTab";
import SettingsTab from "@/components/admin/SettingsTab";
import MemberAdminSettingsTab from "@/components/admin/MemberAdminSettingsTab";
import FreelancersTab from "@/components/admin/FreelancersTab";

const MEMBER_ADMIN_ALLOWED_TABS = [
  "orders",
  "print",
  "news",
  "gcash",
  "jobs",
  "freelancers",
  "settings"
];

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
      // Use Promise.allSettled so one failing table doesn't break the others
      const [ordersRes, printRes, gcashRes, bcoinsRes] = await Promise.allSettled([
        (supabase as any).from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("print_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("gcash_transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("bcoins_redemptions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setPendingCounts({
        orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.count || 0) : 0,
        print: printRes.status === 'fulfilled' ? (printRes.value.count || 0) : 0,
        gcash: gcashRes.status === 'fulfilled' ? (gcashRes.value.count || 0) : 0,
        bcoins: bcoinsRes.status === 'fulfilled' ? (bcoinsRes.value.count || 0) : 0,
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("[AdminDashboard] Pending counts realtime active");
        } else if (status === 'CHANNEL_ERROR') {
          console.warn("[AdminDashboard] Realtime channel error, relying on polling");
        }
      });

    // Poll every 15s to guarantee badge updates even if realtime misses an event
    pendingPollRef.current = setInterval(() => {
      loadPendingCounts();
    }, 15000);

    return () => { 
      supabase.removeChannel(channel); 
      if (pendingPollRef.current) clearInterval(pendingPollRef.current);
    };
  }, [isAuthReady, isAdmin, loadPendingCounts]);

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

  const allTabs = [
    { id: "overview", label: "Overview", icon: BarChart3, badge: 0 },
    { id: "orders", label: "Orders", icon: ShoppingCart, badge: pendingCounts.orders },
    { id: "products", label: "Products", icon: Package, badge: 0 },
    { id: "users", label: "Users", icon: Users, badge: 0 },
    { id: "sellers", label: "Sellers", icon: Crown, badge: 0 },
    { id: "print", label: "Print", icon: Printer, badge: pendingCounts.print },
    { id: "messages", label: "Messages", icon: MessageCircle, badge: pendingCounts.messages },
    { id: "codes", label: "Codes", icon: Ticket, badge: 0 },
    { id: "news", label: "News", icon: Bell, badge: 0 },
    { id: "club", label: "Club", icon: Crown, badge: 0 },
    { id: "bcoins", label: "BCoins", icon: Coins, badge: pendingCounts.bcoins },
    { id: "gcash", label: "GCash", icon: Coins, badge: pendingCounts.gcash },
    { id: "jobs", label: "Jobs", icon: Briefcase, badge: 0 },
    { id: "freelancers", label: "Freelancers", icon: Award, badge: 0 },
    { id: "settings", label: "Settings", icon: Settings, badge: 0 },
  ];

  const availableTabs = isMainAdmin 
    ? allTabs 
    : allTabs.filter(tab => MEMBER_ADMIN_ALLOWED_TABS.includes(tab.id));

  const currentTabAllowed = availableTabs.some(tab => tab.id === activeTab);
  if (!currentTabAllowed && availableTabs.length > 0) {
    const defaultTab = availableTabs.find(tab => tab.id === "overview") || availableTabs[0];
    setActiveTab(defaultTab.id);
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
                className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] font-medium h-auto relative"
              >
                <div className="relative">
                  <tab.icon className="h-4 w-4" />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[8px] font-extrabold rounded-full h-3.5 min-w-3.5 flex items-center justify-center px-0.5 animate-pulse">
                      {tab.badge > 9 ? "9+" : tab.badge}
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
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="sellers"><SellersTab /></TabsContent>
          <TabsContent value="print"><PrintTab /></TabsContent>
          <TabsContent value="messages"><MessagesTab /></TabsContent>
          <TabsContent value="codes"><CodesTab /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
          <TabsContent value="club"><ClubTab /></TabsContent>
          <TabsContent value="bcoins"><BCoinsTab /></TabsContent>
          <TabsContent value="gcash"><GCashTab /></TabsContent>
          <TabsContent value="jobs"><JobsTab /></TabsContent>
          <TabsContent value="freelancers"><FreelancersTab /></TabsContent>
          <TabsContent value="settings">{isMainAdmin ? <SettingsTab /> : <MemberAdminSettingsTab />}</TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}