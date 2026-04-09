import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import OverviewTab from "@/components/admin/OverviewTab";
import OrdersTab from "@/components/admin/OrdersTab";
import ProductsTab from "@/components/admin/ProductsTab";
import CategoriesTab from "@/components/admin/CategoriesTab";
import UsersTab from "@/components/admin/UsersTab";
import PrintTab from "@/components/admin/PrintTab";
import CodesTab from "@/components/admin/CodesTab";
import NewsTab from "@/components/admin/NewsTab";
import ClubTab from "@/components/admin/ClubTab";
import BCoinsTab from "@/components/admin/BCoinsTab";
import GCashTab from "@/components/admin/GCashTab";
import SellersTab from "@/components/admin/SellersTab";
import SettingsTab from "@/components/admin/SettingsTab";
import MemberAdminSettingsTab from "@/components/admin/MemberAdminSettingsTab";
import BannerTab from "@/components/admin/BannerTab";
import { notifyCustomerOrder } from "@/lib/notifications";   // ← NEW IMPORT

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
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null); // ✅ Declare ref

  const loadPendingCounts = useCallback(async () => {
    try {
      const [ordersRes, printRes, gcashRes, bcoinsRes] = await Promise.allSettled([
        (supabase as any).from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("print_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("gcash_transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("bcoins_redemptions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      
      setPendingCounts({
        orders: ordersRes.status === "fulfilled" ? (ordersRes.value as any).count || 0 : 0,
        print: printRes.status === "fulfilled" ? (printRes.value as any).count || 0 : 0,
        gcash: gcashRes.status === "fulfilled" ? (gcashRes.value as any).count || 0 : 0,
        bcoins: bcoinsRes.status === "fulfilled" ? (bcoinsRes.value as any).count || 0 : 0,
        messages: 0,
      });
    } catch (e) {
      console.error("Failed to load pending counts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      loadPendingCounts();
    }
  }, [isAuthReady, isAdmin, loadPendingCounts]);

  // ----------  NEW: Notify the customer when status changes ----------
  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const { data: order } = await (supabase as any)
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!order) {
        toast.error("Order not found");
        return;
      }

      // ----------  UPDATE THE DB ----------
      await (supabase as any)
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      // ----------  NOTIFY THE CUSTOMER ----------
      const statusMsg = {
        approved: "Your order has been **approved** – it’s now being processed.",
        completed: "Your order has been **completed** – you can leave a review!",
        rejected: "Your order was **rejected** – you’ll receive a refund."
      }[newStatus] ?? "Your order status has changed.";

      // `order.customer_id` points to the customer’s profile
      await notifyCustomerOrder(order.customer_id, statusMsg);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
    } finally {
      setUpdating(false);
    }
  }, []); // end of updateStatus

  // ... rest of component unchanged