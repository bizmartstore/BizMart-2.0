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
  Crown, Coins, Settings, BarChart3, Bell, RefreshCw, Briefcase, Ticket
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

// Define which tabs member admins can access
const MEMBER_ADMIN_ALLOWED_TABS = [
  "orders",
  "news",
  "gcash",
  "jobs",
  "pos"
];

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

  // Define all available tabs
  const allTabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "products", label: "Products", icon: Package },
    { id: "users", label: "Users", icon: Users },
    { id: "sellers", label: "Sellers", icon: Crown },
    { id: "print", label: "Print", icon: Printer },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "codes", label: "Codes", icon: Ticket },
    { id: "news", label: "News", icon: Bell },
    { id: "club", label: "Club", icon: Crown },
    { id: "bcoins", label: "BCoins", icon: Coins },
    { id: "gcash", label: "GCash", icon: Coins },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "pos", label: "POS", icon: ShoppingCart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Filter tabs based on role
  const availableTabs = isMainAdmin 
    ? allTabs 
    : allTabs.filter(tab => MEMBER_ADMIN_ALLOWED_TABS.includes(tab.id));

  // Set default active tab based on role if current one is not allowed
  const currentTabAllowed = availableTabs.some(tab => tab.id === activeTab);
  if (!currentTabAllowed && availableTabs.length > 0) {
    // Prefer "overview" if available, otherwise use first allowed tab
    const defaultTab = availableTabs.find(tab => tab.id === "overview") || availableTabs[0];
    setActiveTab(defaultTab.id);
  }

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
            {availableTabs.map((tab) => (
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

          {/* All tab contents remain the same - they'll only be accessible if the tab is shown */}
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
          <TabsContent value="pos"><POSTab role={isMainAdmin ? "main_admin" : "member_admin"} onSaleComplete={() => {}} /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}