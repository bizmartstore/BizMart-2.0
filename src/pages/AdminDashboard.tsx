import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea;
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Schedule, Clock, CheckCircle2, XCircle, Truck, MapPin, Star, Briefcase, AlertTriangle, Printer, Upload, Download, Shield, Settings, Bell, MessageCircle, ArrowLeft, ArrowRight, User, Store, TrendingUp, Package, Coins, Smartphone, GraduationCap, Heart, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import AdminOrdersTab from "@/components/admin/AdminOrdersTab";
import AdminProductsTab from "@/components/admin/AdminProductsTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminGCashTab from "@/components/admin/AdminGCashTab";
import AdminBCoinsTab from "@/components/admin/AdminBCoinsTab";
import AdminClubTab from "@/components/admin/AdminClubTab";
import AdminMessagesTab from "@/components/admin/AdminMessagesTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import AdminPostsTab from "@/components/admin/AdminPostsTab";
import AdminCodesTab from "@/components/admin/CodesTab";
import POSTab from "@/components/admin/POSTab";
import { notifyAdminNewRegistration } from "@/lib/notifications";

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const { role, isAdmin, isMainAdmin, isMemberAdmin, loading: roleLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [overviewStats, setOverviewStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalBCoins: 0,
    totalPrintJobs: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [gcashTransactions, setGcashTransactions] = useState<any[]>([]);
  const [gcashLoading, setGcashLoading] = useState(true);
  const [bcoinsTransactions, setBcoinsTransactions] = useState<any[]>([]);
  const [bcoinsLoading, setBcoinsLoading] = useState(true);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [clubLoading, setClubLoading] = useState(true);
  const [printJobs, setPrintJobs] = useState<any[]>([]);
  const [printLoading, setPrintLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedPrintJob, setSelectedPrintJob] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const [selectedClubMember, setSelectedClubMember] = useState<any | null>(null);
  const [selectedPrintJobDetails, setSelectedPrintJobDetails] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [codesLoading, setCodesLoading] = useState(true);
  const [sellerCodes, setSellerCodes] = useState<any[]>([]);
  const [clubCodes, setClubCodes] = useState<any[]>([]);
  const [newSellerCode, setNewSellerCode] = useState("");
  const [newClubCode, setNewClubCode] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, any>>({});
  const [searchUser, setSearchUser] = useState("");
  const [sendingCode, setSendingCode] = useState<{ code: string; type: "seller" | "club"; id: string } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadOverview = async () => {
      try {
        const [usersResp, sellersResp, ordersResp, revenueResp, bcoinsResp, printJobsResp] = await Promise.all([
          (supabase as any).from("profiles").select("id", { count: "exact" }),
          (supabase as any).from("seller_profiles").select("id", { count: "exact" }),
          (supabase as any).from("orders").select("id", { count: "exact" }),
          (supabase as any).from("orders").select("total", { aggregate: "sum" }),
          (supabase as any).from("bcoins_wallets").select("balance"),
          (supabase as any).from("print_orders").select("id", { count: "exact" }),
        ]);
        const totalUsers = usersResp.count || 0;
        const totalSellers = sellersResp.count || 0;
        const totalOrders = ordersResp.count || 0;
        const totalRevenue = Number((revenueResp[0]?.sum || 0).toFixed(2));
        const totalBCoins = Number((bcoinsResp.reduce((sum: number, wal: any) => sum + Number(wal.balance || 0), 0)).toFixed(1));
        const totalPrintJobs = printJobsResp.count || 0;
        setOverviewStats({
          totalUsers,
          totalSellers,
          totalOrders,
          totalRevenue,
          totalBCoins,
          totalPrintJobs,
        });
        setOverviewLoading(false);
      } catch (error) {
        console.error("Error loading overview stats:", error);
        setOverviewLoading(false);
      }
    };

    const loadSales = async () => {
      try {
        const { data } = await (supabase as any)
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        setSales(data || []);
        setSalesLoading(false);
      } catch (error) {
        console.error("Error loading sales:", error);
        setSalesLoading(false);
      }
    };

    const loadGcashTransactions = async () => {
      try {
        const { data } = await (supabase as any)
          .from("gcash_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        setGcashTransactions(data || []);
        setGcashLoading(false);
      } catch (error) {
        console.error("Error loading GCash transactions:", error);
        setGcashLoading(false);
      }
    };

    const loadBcoinsTransactions = async () => {
      try {
        const { data } = await (supabase as any)
          .from("bcoins_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        setBcoinsTransactions(data || []);
        setBcoinsLoading(false);
      } catch (error) {
        console.error("Error loading BCoins transactions:", error);
        setBcoinsLoading(false);
      }
    };

    const loadClubMembers = async () => {
      try {
        const { data } = await (supabase as any)
          .from("club_memberships")
          .select("*, profiles!inner(*)")
          .eq("status", "active")
          .order("membership_date", { ascending: false });
        setClubMembers(data || []);
        setClubLoading(false);
      } catch (error) {
        console.error("Error loading club members:", error);
        setClubLoading(false);
      }
    };

    const loadPrintJobs = async () => {
      try {
        const { data } = await (supabase as any)
          .from("print_orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        setPrintJobs(data || []);
        setPrintLoading(false);
      } catch (error) {
        console.error("Error loading print jobs:", error);
        setPrintLoading(false);
      }
    };

    const loadPosts = async () => {
      try {
        const { data } = await (supabase as any)
          .from("news_updates")
          .select("*")
          .order("created_at", { ascending: false });
        setPosts(data || []);
        setPostsLoading(false);
      } catch (error) {
        console.error("Error loading posts:", error);
        setPostsLoading(false);
      }
    };

    const loadCodes = async () => {
      try {
        const [sellerCodesResp, clubCodesResp, profilesResp] = await Promise.all([
          (supabase as any).from("seller_codes").select("*").order("created_at", { ascending: false }),
          (supabase as any).from("club_codes").select("*").order("created_at", { ascending: false }),
          (supabase as any).from("profiles").select("*").order("first_name"),
        ]);
        setSellerCodes(sellerCodesResp.data || []);
        setClubCodes(clubCodesResp.data || []);
        setProfiles(profilesResp.data || []);

        const allCodes = [...sellerCodes, ...clubCodes];
        const adminIds = [...new Set(allCodes.map((c: any) => c.generated_by).filter(Boolean))];
        if (adminIds.length > 0) {
          const { data: admProfs } = await (supabase as any).from("profiles").select("*").in("user_id", adminIds);
          const map: Record<string, any> = {};
          (admProfs || []).forEach((p: any) => { map[p.user_id] = p; });
          setAdminProfiles(map);
        }
        setCodesLoading(false);
      } catch (error) {
        console.error("Error loading codes:", error);
        setCodesLoading(false);
      }
    };

    loadOverview();
    loadSales();
    loadGcashTransactions();
    loadBcoinsTransactions();
    loadClubMembers();
    loadPrintJobs();
    loadPosts();
    loadCodes();

    // Realtime subscriptions
    const channels = [
      supabase.channel("overview-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => loadOverview())
        .on("postgres_changes", { event: "*", schema: "public", table: "seller_profiles" }, () => loadOverview())
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { loadOverview(); loadSales(); })
        .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_wallets" }, () => loadOverview())
        .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => loadOverview())
        .subscribe(),
      supabase.channel("sales-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadSales())
        .subscribe(),
      supabase.channel("gcash-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "gcash_transactions" }, () => loadGcashTransactions())
        .subscribe(),
      supabase.channel("bcoins-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_transactions" }, () => loadBcoinsTransactions())
        .subscribe(),
      supabase.channel("club-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "club_memberships" }, () => loadClubMembers())
        .subscribe(),
      supabase.channel("print-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => loadPrintJobs())
        .subscribe(),
      supabase.channel("posts-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "news_updates" }, () => loadPosts())
        .subscribe(),
      supabase.channel("codes-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "seller_codes" }, () => loadCodes())
        .on("postgres_changes", { event: "*", schema: "public", table: "club_codes" }, () => loadCodes())
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => { supabase.removeChannel(channel); });
    };
  }, [user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Admin Dashboard</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login as an admin to access the dashboard.</p>
          <Button onClick={() => window.location.href = "/login"}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (roleLoading || overviewLoading || salesLoading || gcashLoading || bcoinsLoading || clubLoading || printLoading || postsLoading || codesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-4 text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-extrabold text-xl text-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage BizMart Store</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                (supabase as any).auth.signOut();
                window.location.href = "/login";
              }}
              variant="outline"
              className="h-10"
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="overview" className="text-xs gap-1"><Bell className="h-3 w-3" />Overview</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs gap-1"><ShoppingCart className="h-3 w-3" />Orders</TabsTrigger>
            <TabsTrigger value="products" className="text-xs gap-1"><Package className="h-3 w-3" />Products</TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1"><User className="h-3 w-3" />Users</TabsTrigger>
            <TabsTrigger value="gcash" className="text-xs gap-1"><Smartphone className="h-3 w-3" />GCash</TabsTrigger>
            <TabsTrigger value="bcoins" className="text-xs gap-1"><Coins className="h-3 w-3" />BCoins</TabsTrigger>
            <TabsTrigger value="club" className="text-xs gap-1"><GraduationCap className="h-3 w-3" />Club</TabsTrigger>
            <TabsTrigger value="print" className="text-xs gap-1"><Printer className="h-3 w-3" />Print</TabsTrigger>
            <TabsTrigger value="posts" className="text-xs gap-1"><MessageSquare className="h-3 w-3" />Posts</TabsTrigger>
            <TabsTrigger value="codes" className="text-xs gap-1"><Tag className="h-3 w-3" />Codes</TabsTrigger>
            <TabsTrigger value="pos" className="text-xs gap-1"><Receipt className="h-3 w-3" />POS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground font-semibold">Total Users</span>
                    <span className="text-xl font-extrabold text-primary">{overviewStats.totalUsers}</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground font-semibold">Total Sellers</span>
                    <span className="text-xl font-extrabold text-primary">{overviewStats.totalSellers}</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground font-semibold">Total Orders</span>
                    <span className="text-xl font-extrabold text-primary">{overviewStats.totalOrders}</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground font-semibold">Total Revenue</span>
                    <span className="text-xl font-extrabold text-primary">₱{overviewStats.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground font-semibold">Total BCoins</span>
                    <span className="text-xl font-extrabold text-primary">{overviewStats.totalBCoins}</span>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground font-semibold">Total Print Jobs</span>
                    <span className="text-xl font-extrabold text-primary">{overviewStats.totalPrintJobs}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-bold text-sm mb-3">Recent Orders</h3>
                {sales.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-6">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {sales.slice(0, 5).map((order) => (
                      <div key={order.id} className="bg-card rounded-lg p-3 border border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                          {order.customer_name && (
                            <span className="text-[10px] text-foreground font-bold ml-2">{order.customer_name}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-primary/20 text-primary'
                        }`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders"><AdminOrdersTab /></TabsContent>
          <TabsContent value="products"><AdminProductsTab /></TabsContent>
          <TabsContent value="users"><AdminUsersTab /></TabsContent>
          <TabsContent value="gcash"><AdminGCashTab /></TabsContent>
          <TabsContent value="bcoins"><AdminBCoinsTab /></TabsContent>
          <TabsContent value="club"><AdminClubTab /></TabsContent>
          <TabsContent value="print"><AdminSettingsTab /></TabsContent>
          <TabsContent value="posts"><AdminPostsTab /></TabsContent>
          <TabsContent value="codes"><AdminCodesTab /></TabsContent>
          <TabsContent value="pos"><POSTab /></TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}