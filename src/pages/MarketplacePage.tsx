// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    supabase
      .from("seller_profiles")
      .select("*")
      .eq("is_active", true)
      .then(({ data }: any) => {
        const map: Record<string, any> = {};
        (data || []).forEach((s: any) => { map[s.user_id] = s; }); // seller_profiles uses user_id
        setSellerProfiles(map);
      });
  }, []);

// ... (rest of component)