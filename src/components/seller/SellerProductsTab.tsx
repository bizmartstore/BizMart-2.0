// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const load = () => {
    supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id) // products table has seller_id
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setProducts(data || []));
  };

// ... (rest of component)