// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const { data: announcement } = useQuery({
    queryKey: ['announcement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) return null;
      return data[0];
    },
    // ... (rest of query options)
  });

// ... (rest of component)