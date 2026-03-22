import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Search, Filter, Clock, MapPin, Star, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JobsPage() {
  const { user, profile } = useAuth();               // ✅ Get profile
  const navigate = useNavigate();
  const [isClubMember, setIsClubMember] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [freelancerStatus, setFreelancerStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      // ✅ Use profile.role for any admin‑related checks (if you added any later)
      // Example: if (profile?.role === 'admin') { … }

      const { data: membership } = await (supabase as any)
        .from("club_memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      
      setIsClubMember(!!membership);

      const { data: freelancer } = await (supabase as any)
        .from("freelancer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (freelancer) {
        setIsFreelancer(freelancer.status === "approved");
        setFreelancerStatus(freelancer.status);
      }

      const { data: allJobs } = await (supabase as any)
        .from("job_postings")
        .select("*, client:profiles!job_postings_client_id_fkey(*)")
        .eq("status", "open")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      
      setJobs(allJobs || []);

      const { data: userJobs } = await (supabase as any)
        .from("job_postings")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      
      setMyJobs(userJobs || []);

      setLoading(false);
    };

    checkAccess();
  }, [user, profile]);   // ✅ Depend on profile

  // ... rest of component unchanged
}