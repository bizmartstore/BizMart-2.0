// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const loadOrders = useCallback(async () => {
    setLoading(true);
    // Join orders with profiles for customer info
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        profiles:orders_user_id_fkey(*)
      `)
      .order("created_at", { ascending: false });
    
    // Transform data to include profile info
    const orders = (data || []).map((o: any) => ({
      ...o,
      profiles: o.profiles ? (Array.isArray(o.profiles) ? o.profiles[0] : o.profiles) : null,
    }));
    
    setOrders(orders);
    setLoading(false);
  }, []);

// ... (rest of component)