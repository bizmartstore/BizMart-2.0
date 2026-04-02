// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    if (user) {
      // Check membership using user_id (club_memberships table uses user_id foreign key)
      (supabase as any)
        .from("club_memberships")
        .select("*")
        .eq("user_id", user.id) // club_memberships has user_id field
        .eq("status", "active")
        .maybeSingle()
        .then(({ data }: any) => {
          setMembership(data);
          setCheckingMembership(false);
        });

      // Check seller profile using user_id
      (supabase as any)
        .from("seller_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }: any) => setSellerProfile(data));

      // Check existing application using user_id
      (supabase as any)
        .from("seller_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }: any) => setApplication(data));
    } else {
      setCheckingMembership(false);
    }

    // Get seller count and max
    (supabase as any)
      .from("seller_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .then(({ count }: any) => setSellerCount(count || 0));

    (supabase as any)
      .from("app_settings")
      .select("*")
      .eq("key", "max_sellers")
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.value?.max) setMaxSellers(data.value.max);
      });
  }, [user]);

// ... (rest of component)