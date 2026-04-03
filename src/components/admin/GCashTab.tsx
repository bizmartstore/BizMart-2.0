import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";

export default function GCashTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
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
        const { data: txData, error } = await (supabase as any)
          .from("gcash_transactions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTransactions(txData || []);

        // Poll every 5 seconds to refresh transaction list
        const poll = setInterval(async () => {
          try {
            const { data: freshData, error: freshError } = await (supabase as any)
              .from("gcash_transactions")
              .select("*")
              .order("created_at", { ascending: false });
            if (!freshError) setTransactions(freshData);
          } catch (e) {
            console.error("Failed to refresh GCash transactions:", e);
          }
        }, 5000);

        return () => clearInterval(poll);
      }, []);

      return () => { if (isMounted) clearInterval(poll); };
    };

    // ... rest of component unchanged
  }, []);

  // ... rest of component unchanged