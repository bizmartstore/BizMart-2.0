import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Package, ShoppingCart, Printer, MessageCircle, Crown, Coins, Settings, BarChart3, Bell, Briefcase, Ticket, Award } from "lucide-react";
import OverviewTab from "@/components/admin/OverviewTab";
import OrdersTab from "@/components/admin/OrdersTab";
import ProductsTab from "@/components/admin/ProductsTab";
import UsersTab from "@/components/admin/UsersTab";
import PrintTab from "@/components/admin/PrintTab";
import MessagesTab from "@/components/admin/MessagesTab";
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
import BannerTab from "@/components/admin/BannerTab";

const MEMBER_ADMIN_ALLOWED_TABS = [
  "overview",
  "orders",
  "print",
  "news",
  "gcash",
  "banners",
  "club"
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
    jobs: 0,
    freelancers: 0,
  });
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadPendingCounts = useCallback(async () => {
    try {
      const [ordersRes, printRes, gcashRes, bcoinsRes, jobsRes, freelancersRes] = await Promise.allSettled([
        (supabase as any).from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("print_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("gcash_transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("bcoins_redemptions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("job_postings").select("id", { count: "exact", head: true }).eq("status", "open"),
        (supabase as any).from("freelancer_profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      
      setPendingCounts({
        orders: ordersRes.status === "fulfilled" ? (ordersRes.value.count || 0) : 0,
        print: printRes.status === "fulfilled" ? (printRes.value.count || 0) : 0,
        gcash: bcoinsRes.status === "fulfilled" ? (bcoinsRes.value.count || 0) : 0,
        bcoins: bcoinsRes.status === "fulfilled" ? (bcoinsRes.value.count || 0) : 0,
        messages: 0,
        jobs: jobsRes.status === "fulfilled" ? (jobsRes.value.count || 0) : 0,
        freelancers: freelancersRes.status === "fulfilled" ? (freelancersRes.value.count || 0) : 0,
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
      .on("postgres_changes", { event: "*", schema: "public", table: "job_postings" }, () => loadPendingCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "freelancer_profiles" }, () => loadPendingCounts())
      .subscribe();

    pollIntervalRef.current = setInterval(() => {
      loadPendingCounts();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isAdmin, loadPendingCounts]);

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
          <TabsList className="w-full grid grid-cols-4 lg:grid-cols-7 h-auto mb-6 bg-muted/50 p-1">
            {availableTabs.map((tab) => (
              <TabsTrigger                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] font-medium h-auto rounded-lg bg-muted/50 hover:bg-primary/10"
              >
                <div className="relative">
                  <tab.icon className="h-4 w-4" />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full h-3.5 min-w-3.5 animate-pulse">
                      {tab.badge}
                    </span>
                  </div>
                </div>
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}

            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="orders"><OrdersTab /></TabsContent>
            <TabsContent value="products"><ProductsTab /></TabsContent>
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
            <TabsContent value="jobs"><JobsTab /></TabsContent>
            <TabsContent value="freelancers"><FreelancersTab /></TabsContent>
            {isMainAdmin ? <TabsContent value="settings"><SettingsTab /></TabsContent> : <TabsContent value="settings"><MemberAdminSettingsTab /></TabsContent>}
          </TabsList>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}