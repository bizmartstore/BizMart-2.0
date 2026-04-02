// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  // Load product orders - orders table uses user_id
  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setOrders(data || []));
  }, [user]);

  // Load print orders - print_orders uses user_id
  useEffect(() => {
    if (!user) return;
    supabase
      .from("print_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setPrintOrders(data || []));
  }, [user]);

// ... (rest of component)