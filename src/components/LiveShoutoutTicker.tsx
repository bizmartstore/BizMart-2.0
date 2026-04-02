// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const { data: items = [] } = useQuery({
    queryKey: ['live-shoutouts'],
    queryFn: async () => {
      if (!user) return [];
      
      // For live shoutouts, we want to show all public ones (target_role is null)
      const { data, error } = await supabase
        .from("notification_logs")
        .select("id, title, message, icon, created_at")
        .eq("type", "live_shoutout")
        .is("target_role", null)
        .is("target_user_id", null)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error || !data) return [];
      return data;
    },
    // ... (rest of query options)
  });

// ... (rest of component)