// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    // seller_profiles uses user_id
    supabase
      .from("seller_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!data) { navigate("/club"); return; }
        setLoading(false);
      });
  }, [user, navigate]);

// ... (rest of component)