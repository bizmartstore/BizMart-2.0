import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import TopBar from "@/components/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "@/components/admin/OverviewTab";
import OrdersTab from "@/components/admin/OrdersTab";
import ProductsTab from "@/components/admin/ProductsTab";
import UsersTab from "@/components/admin/UsersTab";
import PrintTab from "@/components/admin/PrintTab";
import GCashTab from "@/components/admin/GCashTab";
import BCoinsTab from "@/components/admin/BCoinsTab";
import ClubTab from "@/components/admin/ClubTab";
import SellersTab from "@/components/admin/SellersTab";
import CodesTab from "@/components/admin/CodesTab";
import SettingsTab from "@/components/admin/SettingsTab";
import NewsTab from "@/components/admin/NewsTab";
import { AdminMessagesTab } from "@/components/admin/AdminMessagesTab";
import { POSTab } from "@/components/admin/POSTab";
import JobsTab from "@/components/admin/JobsTab";

export default function AdminDashboard() {
  const { role, loading: roleLoading, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [roleLoading, isAdmin, navigate]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab) setActiveTab(tab);
  }, [location.search]);

  if (roleLoading || !isAdmin) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="p-4 max-w-6xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-4">Admin Dashboard</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 lg:grid-cols-8 mb-4 h-auto p-1">
            <TabsTrigger value="overview" className="text-[10px]">Overview</TabsTrigger>
            <TabsTrigger value="orders" className="text-[10px]">Orders</TabsTrigger>
            <TabsTrigger value="products" className="text-[10px]">Products</TabsTrigger>
            <TabsTrigger value="users" className="text-[10px]">Users</TabsTrigger>
            <TabsTrigger value="print" className="text-[10px]">Print</TabsTrigger>
            <TabsTrigger value="gcash" className="text-[10px]">GCash</TabsTrigger>
            <TabsTrigger value="bcoins" className="text-[10px]">BCoins</TabsTrigger>
            <TabsTrigger value="club" className="text-[10px]">Club</TabsTrigger>
            <TabsTrigger value="sellers" className="text-[10px]">Sellers</TabsTrigger>
            <TabsTrigger value="codes" className="text-[10px]">Codes</TabsTrigger>
            <TabsTrigger value="news" className="text-[10px]">News</TabsTrigger>
            <TabsTrigger value="messages" className="text-[10px]">Messages</TabsTrigger>
            <TabsTrigger value="pos" className="text-[10px]">POS</TabsTrigger>
            <TabsTrigger value="jobs" className="text-[10px]">Jobs</TabsTrigger>
            <TabsTrigger value="settings" className="text-[10px]">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="print"><PrintTab /></TabsContent>
          <TabsContent value="gcash"><GCashTab /></TabsContent>
          <TabsContent value="bcoins"><BCoinsTab /></TabsContent>
          <TabsContent value="club"><ClubTab /></TabsContent>
          <TabsContent value="sellers"><SellersTab /></TabsContent>
          <TabsContent value="codes"><CodesTab /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
          <TabsContent value="messages"><AdminMessagesTab /></TabsContent>
          <TabsContent value="pos"><POSTab /></TabsContent>
          <TabsContent value="jobs"><JobsTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}