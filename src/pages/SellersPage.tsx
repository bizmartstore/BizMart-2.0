// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    supabase
      .from("seller_profiles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        setSellers(data || []);
        setLoading(false);
      });
  }, []);

// ... (rest of component)