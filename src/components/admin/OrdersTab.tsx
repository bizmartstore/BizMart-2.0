import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Truck, Package, Eye, ShoppingCart, Printer, Loader2, RefreshCw } from "lucide-react";
import { sendNotification, notifyCustomerBCoins } from "@/lib/notifications";

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
      // 👇 JOIN PROFILES TO GET CUSTOMER DETAILS
      const { data: ordersRes, error: ordersError } = await (supabase as any)
        .from("orders")
        .select(`
          *,
          customer:user_id (first_name, last_name, section, grade_level)
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // 👇 ALSO FETCH PRINT ORDERS (they have no customer relationship)
      const { data: printRes, error: printError } = await (supabase as any)
        .from("print_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (printError) throw printError;

      // Combine and enrich with profile data
      const combined = [...ordersRes.data];
      const printData = printRes.data || [];
      const posData = []; // Placeholder for pos orders if needed

      // Add profile info to orders
      const ordersWithProfile = await Promise.all(
        combined.map(async (order: any) => {
          if (order.customer?.user_id) {
            const { data: profileData, error: profileError } = await (supabase as any)
              .from("profiles")
              .select("first_name, last_name, section, grade_level")
              .eq("user_id", order.customer.user_id)
              .single();
            if (!profileError) {
              order.customer.first_name = profileData.first_name;
              order.customer.last_name = profileData.last_name;
              order.customer.section = profileData.section;
              order.customer.grade_level = profileData.grade_level;
            }
          }
          return order;
        })
      );

      // Also enrich print orders with profile data
      const printEnriched = await Promise.all(
        printData.map(async (order: any) => {
          if (order.user_id) {
            const { data: profileData, error: profileError } = await (supabase as any)
              .from("profiles")
              .select("first_name, last_name, section, grade_level")
              .eq("user_id", order.user_id)
              .single();
            if (!profileError) {
              order.customer = {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                section: profileData.section,
                grade_level: profileData.grade_level,
              };
            }
          }
          return order;
        })
      );

      // Placeholder for pos orders enrichment
      const posEnriched = posData;

      setOrders([...ordersWithProfile, ...printEnriched, ...posEnriched]);
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

  // ... rest of component unchanged except rendering logic below ...