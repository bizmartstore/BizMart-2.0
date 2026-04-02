import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RefreshCw, Gift, Loader2 } from "lucide-react";
import { sendNotification } from "@/lib/notifications";

export default function BCoinsTab() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: redemptionsData, error } = await (supabase as any)
        .from("bcoins_redemptions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const userIds = redemptionsData?.map((r: any) => r.user_id).filter(Boolean) || [];
      let enriched = redemptionsData || [];
      
      if (userIds.length > 0) {
        const { data: profs } = await (supabase as any)
          .from("profiles")
          .select("user_id, first_name, last_name, email")
          .in("user_id", userIds);
        
        const profileMap = new Map(profs?.map((p: any) => [p.user_id, p]));
        enriched = redemptionsData.map((r: any) => ({
          ...r,
          profiles: profileMap.get(r.user_id) || null,
        }));
      }
      
      setRedemptions(enriched);
    } catch (e: any) {
      console.error("Failed to load redemptions:", e);
      toast.error("Failed to load redemptions: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription for BCoins redemptions
  useEffect(() => {
    const channel = supabase
      .channel("admin-bcoins-redemptions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_redemptions" }, () => {
        console.log("[BCoinsTab] bcoins_redemptions changed, reloading...");
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const { data: redemption } = await (supabase as any)
        .from("bcoins_redemptions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (!redemption) {
        toast.error("Redemption not found");
        return;
      }

      await (supabase as any)
        .from("bcoins_redemptions")
        .update({ status })
        .eq("id", id);

      if (status === "rejected") {
        const { data: wallet } = await (supabase as any)
          .from("bcoins_wallets")
          .select("balance")
          .eq("user_id", redemption.user_id)
          .maybeSingle();
        
        if (wallet) {
          await (supabase as any)
            .from("bcoins_wallets")
            .update({ balance: Number(wallet.balance) + Number(redemption.bcoins_amount) })
            .eq("user_id", redemption.user_id);
          
          await (supabase as any)
            .from("bcoins_transactions")
            .insert({
              user_id: redemption.user_id,
              amount: Number(redemption.bcoins_amount),
              type: "refund",
              description: `Refund for rejected ₱${redemption.gcash_amount} GCash redemption`,
            });
        }
      }

      await sendNotification({
        title: `🎁 Redemption ${status.toUpperCase()}`,
        message: `Your ₱${redemption.gcash_amount} GCash redemption has been ${status}.`,
        type: "redemption_status",
        userId: redemption.user_id,
        link: "/bcoins",
        icon: "🎁"
      });

      toast.success(`Redemption ${status}!`);
      // Real-time will trigger automatically
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? redemptions : redemptions.filter(r => r.status === filter);
  const statusCounts = {
    all: redemptions.length,
    pending: redemptions.filter(r => r.status === "pending").length,
    completed: redemptions.filter(r => r.status === "completed").length,
    rejected: redemptions.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Object.entries(statusCounts).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(r => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold text-xs">
                      {r.profiles?.first_name} {r.profiles?.last_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{r.gcash_number}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  r.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                  r.status === 'pending' ? 'bg-warning/20 text-warning' :
                  'bg-destructive/20 text-destructive'
                }`}>
                  {r.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-sm font-extrabold text-primary block">₱{r.gcash_amount}</span>
                  <span className="text-[9px] text-muted-foreground">GCash</span>
                </div>
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-sm font-extrabold text-warning block">{Number(r.bcoins_amount).toFixed(1)}</span>
                  <span className="text-[9px] text-muted-foreground">BCoins</span>
                </div>
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-sm font-extrabold block">{new Date(r.created_at).toLocaleDateString()}</span>
                  <span className="text-[9px] text-muted-foreground">Date</span>
                </div>
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(r.id, "completed")}
                    disabled={updating === r.id}
                    className="gap-1 flex-1"
                  >
                    {updating === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(r.id, "rejected")}
                    disabled={updating === r.id}
                    className="gap-1 flex-1"
                  >
                    {updating === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">No redemptions found</p>
          )}
        </div>
      )}
    </div>
  );
}