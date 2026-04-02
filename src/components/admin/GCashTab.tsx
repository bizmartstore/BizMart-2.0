// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const load = useCallback(async () => {
    setLoading(true);
    // Join gcash_transactions with profiles
    const { data } = await supabase
      .from("gcash_transactions")
      .select(`
        *,
        profiles:gcash_transactions_user_id_fkey(*)
      `)
      .order("created_at", { ascending: false });
    
    // Transform data
    const transactions = (data || []).map((tx: any) => ({
      ...tx,
      profiles: tx.profiles ? (Array.isArray(tx.profiles) ? tx.profiles[0] : tx.profiles) : null,
    }));
    
    setTransactions(transactions);
    setLoading(false);
  }, []);

// ... (rest of component)