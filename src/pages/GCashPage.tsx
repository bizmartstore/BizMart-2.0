// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    if (user) {
      // gcash_transactions uses user_id
      (supabase as any)
        .from("gcash_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }: any) => setTransactions(data || []));
    }
  }, [user]);

// ... (rest of component)