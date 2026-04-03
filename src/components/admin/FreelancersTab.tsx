import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RefreshCw, User, Star, Loader2, Search } from "lucide-react";

export default function FreelancersTab() {
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const { data: apps, error } = await (supabase as any)
          .from("freelancer_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setApplications(apps || []);

        // Poll every 5 seconds to refresh applications
        const poll = setInterval(async () => {
          try {
            const { data: freshApps, error: freshError } = await (supabase as any)
              .from("freelancer_profiles")
              .select("*")
              .order("created_at", { ascending: false });
            if (!freshError) setApplications(freshApps);
          } catch (e) {
            console.error("Failed to refresh freelancer apps:", e);
          }
        }, 5000);

        return () => clearInterval(poll);
      } catch (e: any) {
        console.error("Failed to load freelancer applications:", e);
        if (isMounted) toast.error("Failed to load applications");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    // ... rest of effect unchanged
  }, []);

  // ... rest of component unchanged