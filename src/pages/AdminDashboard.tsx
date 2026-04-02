"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RefreshCw, Loader2, Shield, Crown, Users, ShoppingCart, Printer, DollarSign, TrendingUp, Package, Clock, CheckCircle2, AlertCircle, Briefcase, MessageCircle } from "lucide-react";
import OverviewTab from "@/components/admin/OverviewTab";
import OrdersTab from "@/components/admin/OrdersTab";
import ProductsTab from "@/components/admin/ProductsTab";
import SellersTab from "@/components/admin/SellersTab";
import PrintTab from "@/components/admin/PrintTab";
import BCoinsTab from "@/components/admin/BCoinsTab";
import GCashTab from "@/components/admin/GCashTab";
import ClubTab from "@/components/admin/ClubTab";
import CodesTab from "@/components/admin/CodesTab";
import UsersTab from "@/components/admin/UsersTab";
import JobsTab from "@/components/admin/JobsTab";
import SettingsTab from "@/components/admin/SettingsTab";
import NewsTab from "@/components/admin/NewsTab";
import AdminMessagesTab from "@/components/admin/AdminMessagesTab";
import POSTab from "@/components/admin/POSTab";

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin, isMainAdmin, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user || !isAdmin) {
        navigate("/login");
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
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
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            
            {/* LOGOUT BUTTON */}
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  toast.success("Logged out successfully");
                  navigate('/login');
                } catch (error: any) {
                  toast.error("Logout failed: " + error.message);
                }
              }}
              className="gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1 mb-6 h-auto flex-wrap">
            <TabsTrigger value="overview" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />Overview</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs gap-1"><ShoppingCart className="h-3 w-3" />Orders</TabsTrigger>
            <TabsTrigger value="products" className="text-xs gap-1"><Package className="h-3 w-3" />Products</TabsTrigger>
            <TabsTrigger value="sellers" className="text-xs gap-1"><Users className="h-3 w-3" />Sellers</TabsTrigger>
            <TabsTrigger value="print" className="text-xs gap-1"><Printer className="h-3 w-3" />Print</TabsTrigger>
            <TabsTrigger value="bcoins" className="text-xs gap-1"><DollarSign className="h-3 w-3" />BCoins</TabsTrigger>
            <TabsTrigger value="gcash" className="text-xs gap-1"><DollarSign className="h-3 w-3" />GCash</TabsTrigger>
            <TabsTrigger value="club" className="text-xs gap-1"><Crown className="h-3 w-3" />Club</TabsTrigger>
            <TabsTrigger value="codes" className="text-xs gap-1"><Shield className="h-3 w-3" />Codes</TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1"><Users className="h-3 w-3" />Users</TabsTrigger>
            <TabsTrigger value="jobs" className="text-xs gap-1"><Briefcase className="h-3 w-3" />Jobs</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs gap-1"><MessageCircle className="h-3 w-3" />Messages</TabsTrigger>
            <TabsTrigger value="pos" className="text-xs gap-1"><ShoppingCart className="h-3 w-3" />POS</TabsTrigger>
            <TabsTrigger value="news" className="text-xs gap-1"><AlertCircle className="h-3 w-3" />News</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1"><RefreshCw className="h-3 w-3" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="sellers"><SellersTab /></TabsContent>
          <TabsContent value="print"><PrintTab /></TabsContent>
          <TabsContent value="bcoins"><BCoinsTab /></TabsContent>
          <TabsContent value="gcash"><GCashTab /></TabsContent>
          <TabsContent value="club"><ClubTab /></TabsContent>
          <TabsContent value="codes"><CodesTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="jobs"><JobsTab /></TabsContent>
          <TabsContent value="messages"><AdminMessagesTab /></TabsContent>
          <TabsContent value="pos"><POSTab role={profile?.role || "customer"} onSaleComplete={() => {}} /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}