// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const loadData = async () => {
    if (!user) return;
    
    // bcoins_wallets uses user_id
    const { data: w } = await supabase
      .from("bcoins_wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (w) {
      setWallet(w);
    } else {
      // Create wallet with user_id
      const { data: newW } = await supabase
        .from("bcoins_wallets")
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single();
      setWallet(newW);
    }
    
    // bcoins_transactions uses user_id
    const { data: txns } = await supabase
      .from("bcoins_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setTransactions(txns || []);
    
    // bcoins_redemptions uses user_id
    const { data: reds } = await supabase
      .from("bcoins_redemptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setRedemptions(reds || []);
  };

// ... (rest of component)