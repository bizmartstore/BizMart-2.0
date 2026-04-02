// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const load = useCallback(async () => {
    setLoading(true);
    // Join print_orders with profiles for user info
    const { data } = await supabase
      .from("print_orders")
      .select(`
        *,
        profiles:print_orders_user_id_fkey(*)
      `)
      .order("created_at", { ascending: false });
    
    // Transform data
    const orders = (data || []).map((o: any) => ({
      ...o,
      profiles: o.profiles ? (Array.isArray(o.profiles) ? o.profiles[0] : o.profiles) : null,
    }));
    
    setOrders(orders);
    setLoading(false);
  }, []);

// ... (rest of component)