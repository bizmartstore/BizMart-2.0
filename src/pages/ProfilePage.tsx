// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    if (!user) return;
    // orders table uses user_id
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }: any) => setOrderCount(count || 0));
  }, [user]);

// ... (rest of component)