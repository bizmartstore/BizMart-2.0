import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RefreshCw, Package } from "lucide-react";

export default function BCoinsTab() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const { data: redemptionsData, error } = await (supabase as any)
          .from("bcoins_redemptions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRedemptions(redemptionsData || []);

        // Poll every 5 seconds to refresh redemption counts
        const poll = setInterval(async () => {
          try {
            const { data: freshData, error: freshError } = await (supabase as any)
              .from("bcoins_redemptions")
              .select("*")
              .order("created_at", { ascending: false });
            if (!freshError && freshData) setRedemptions(freshData);
          } catch (e) {
            console.error("Failed to refresh redemptions:", e);
          }
        }, 5000);

        return () => clearInterval(poll);
      }, []);

      // ... existing load logic    };

    // ... rest of component unchanged  }, []);

  // ... rest of component unchanged