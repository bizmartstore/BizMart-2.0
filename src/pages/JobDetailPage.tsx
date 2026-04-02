// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    const loadJob = async () => {
      // Join with client profile using the foreign key
      const { data } = await supabase
        .from("job_postings")
        .select(`
          *,
          client:profiles!job_postings_client_id_fkey(*)
        `)
        .eq("id", id)
        .maybeSingle();
      setJob(data);
      setLoading(false);
    };
    loadJob();
  }, [id]);

// ... (rest of component)