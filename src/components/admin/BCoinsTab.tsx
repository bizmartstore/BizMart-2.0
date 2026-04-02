// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const load = useCallback(async () => {
    setLoading(true);
    // Join bcoins_redemptions with profiles
    const { data } = await supabase
      .from("bcoins_redemptions")
      .select(`
        *,
        profiles:bcoins_redemptions_user_id_fkey(*)
      `)
      .order("created_at", { ascending: false });
    
    // Transform data
    const redemptions = (data || []).map((r: any) => ({
      ...r,
      profiles: r.profiles ? (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) : null,
    }));
    
    setRedemptions(redemptions);
    setLoading(false);
  }, []);

// ... (rest of component)