// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      // Check Club Membership - club_memberships uses user_id
      const { data: membership } = await supabase
        .from("club_memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      
      setIsClubMember(!!membership);

      // Check Freelancer Status - freelancer_profiles uses user_id
      const { data: freelancer } = await supabase
        .from("freelancer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (freelancer) {
        setIsFreelancer(freelancer.status === "approved");
        setFreelancerStatus(freelancer.status);
      }

      // Load Jobs with client info
      const { data: allJobs } = await supabase
        .from("job_postings")
        .select(`
          *,
          client:profiles!job_postings_client_id_fkey(*)
        `)
        .eq("status", "open")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      
      setJobs(allJobs || []);

      // Load user's posted jobs
      const { data: userJobs } = await supabase
        .from("job_postings")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      
      setMyJobs(userJobs || []);

      setLoading(false);
    };

    checkAccess();
  }, [user]);

// ... (rest of component)