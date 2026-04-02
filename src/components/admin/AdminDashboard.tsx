import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Package, ShoppingCart, Printer, MessageCircle,
  Crown, Coins, Settings, BarChart3, Bell, RefreshCw, Briefcase, Ticket, Store
} from "lucide-react";
import { toast } from "sonner";
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
import POSTab from "@/components/admin/POSTab";

export default function AdminDashboard() {
  const { user, profile, isAuthReady } = useAuth();
  const { isAdmin, isMainAdmin } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Wait for auth to be fully ready before evaluating access
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If not admin, redirect
  if (!isAdmin) {
    console.log('[AdminDashboard] User is not admin, redirecting...');
    navigate("/");
    return null;
  }

  console.log('[AdminDashboard] Admin access granted. Role:', isMainAdmin ? 'main_admin' : 'member_admin');

  // Define tabs with their permissions
  const allTabs = [
    { id: "overview", label: "Overview", icon: BarChart3, roles: ["main_admin", "member_admin"] },
    { id: "orders", label: "Orders", icon: ShoppingCart, roles: ["main_admin", "member_admin"] },
    { id: "products", label: "Products", icon: Package, roles: ["main_admin", "member_admin"] },
    { id: "users", label: "Users", icon: Users, roles: ["main_admin"] },
    { id: "sellers", label: "Sellers", icon: Store, roles: ["main_admin"] },
    { id: "print", label: "Print", icon: Printer, roles: ["main_admin", "member_admin"] },
    { id: "messages", label: "Messages", icon: MessageCircle, roles: ["main_admin", "member_admin"] },
    { id: "codes", label: "Codes", icon: Ticket, roles: ["main_admin"] },
    { id: "news", label: "News", icon: Bell, roles: ["main_admin", "member_admin"] },
    { id: "club", label: "Club", icon: Crown, roles: ["main_admin"] },
    { id: "bcoins", label: "BCoins", icon: Coins, roles: ["main_admin"] },
    { id: "gcash", label: "GCash", icon: Coins, roles: ["main_admin", "member_admin"] },
    { id: "jobs", label: "Jobs", icon: Briefcase, roles: ["main_admin", "member_admin"] },
    { id: "pos", label: "POS", icon: ShoppingCart, roles: ["main_admin", "member_admin"] },
    { id: "settings", label: "Settings", icon: Settings, roles: ["main_admin"] },
  ];

  // Filter tabs based on user role
  const allowedTabs = allTabs.filter(tab => 
    tab.roles.includes(isMainAdmin ? "main_admin" : "member_admin")
  );

  // Set first allowed tab as default if current tab is not allowed
  useEffect(() => {
    if (!allowedTabs.find(t => t.id === activeTab)) {
      setActiveTab(allowedTabs[0]?.id || "overview");
    }
  }, [activeTab, allowedTabs]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-extrabold text-xl text-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {isMainAdmin ? "👑 Main Admin" : "🛡️ Member Admin"} • {profile?.email}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 lg:grid-cols-8 h-auto mb-6 bg-muted/50 p-1 rounded-xl">
            {allowedTabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex flex-col items-center gap-1 py-2 px-1 text-[10px] font-medium h-auto"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          {allowedTabs.find(t => t.id === "users") && <TabsContent value="users"><UsersTab /></TabsContent>}
          {allowedTabs.find(t => t.id === "sellers") && <TabsContent value="sellers"><SellersTab /></TabsContent>}
          <TabsContent value="print"><PrintTab /></TabsContent>
          <TabsContent value="messages"><MessagesTab /></TabsContent>
          {allowedTabs.find(t => t.id === "codes") && <TabsContent value="codes"><CodesTab /></TabsContent>}
          <TabsContent value="news"><NewsTab /></TabsContent>
          {allowedTabs.find(t => t.id === "club") && <TabsContent value="club"><ClubTab /></TabsContent>}
          {allowedTabs.find(t => t.id === "bcoins") && <TabsContent value="bcoins"><BCoinsTab /></TabsContent>}
          <TabsContent value="gcash"><GCashTab /></TabsContent>
          <TabsContent value="jobs"><JobsTab /></TabsContent>
          <TabsContent value="pos"><POSTab role={isMainAdmin ? "main_admin" : "member_admin"} onSaleComplete={() => {}} /></TabsContent>
          {allowedTabs.find(t => t.id === "settings") && <TabsContent value="settings"><SettingsTab /></TabsContent>}
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}