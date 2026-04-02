// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const load = useCallback(async () => {
    setLoading(true);
    // Fetch seller profiles with user info
    const { data: sellerData } = await supabase
      .from("seller_profiles")
      .select(`
        *,
        profiles:seller_profiles_user_id_fkey(*)
      `)
      .order("created_at", { ascending: false });
    
    // Transform the data to flatten profile info
    const sellers = (sellerData || []).map((s: any) => ({
      ...s,
      profiles: s.profiles ? (Array.isArray(s.profiles) ? s.profiles[0] : s.profiles) : null,
    }));
    
    setSellers(sellers);
    
    // Load applications with user info
    const { data: appData } = await supabase
      .from("seller_applications")
      .select(`
        *,
        profiles:seller_applications_user_id_fkey(*)
      `)
      .order("created_at", { ascending: false });
    
    const applications = (appData || []).map((a: any) => ({
      ...a,
      profiles: a.profiles ? (Array.isArray(a.profiles) ? a.profiles[0] : a.profiles) : null,
    }));
    
    setApplications(applications);
    setLoading(false);
  }, []);

// ... (rest of component)