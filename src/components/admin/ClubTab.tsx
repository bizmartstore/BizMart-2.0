// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const load = useCallback(async () => {
    setLoading(true);
    // Join club_memberships with profiles
    const { data } = await supabase
      .from("club_memberships")
      .select(`
        *,
        profiles:club_memberships_user_id_fkey(*)
      `)
      .order("created_at", { ascending: false });
    
    // Transform data to include profile info
    const members = (data || []).map((m: any) => ({
      ...m,
      profiles: m.profiles ? (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) : null,
    }));
    
    setMembers(members);
    setLoading(false);
  }, []);

// ... (rest of component)