import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Gift, Loader2, Search, RefreshCw, Eye } from "lucide-react";
import { sendNotification } from "@/lib/notifications";
import { Input } from "@/components/ui/input";

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
        
        const userIds = redemptionsData?.map((r: any) => r.user_id).filter(Boolean) || [];
        let enriched = redemptionsData || [];
        
        if (userIds.length > 0) {
          const { data: profs } = await (supabase as any)
            .from("profiles")
            .select("user_id, first_name, last_name, email, grade_level, section")
            .in("user_id", userIds);
          
          const profileMap = new Map(profs?.map((p: any) => [p.user_id, p]));
          enriched = redemptionsData.map((r: any) => ({
            ...r,
            profiles: profileMap.get(r.user_id) || null,
          }));
        }
        
        if (isMounted) setRedemptions(enriched);
      } catch (e: any) {
        console.error("Failed to load redemptions:", e);
        if (isMounted) toast.error("Failed to load redemptions: " + e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel("admin-bcoins-redemptions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_redemptions" }, () => {
        console.log("[BCoinsTab] bcoins_redemptions changed, reloading...");
        load();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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
      if (selectedRedemption?.id === id) setSelectedRedemption(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = redemptions.filter(r => {
    const matchFilter = filter === "all" || r.status === filter;
    const custName = r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : "";
    const matchSearch = !search || 
      custName.toLowerCase().includes(search.toLowerCase()) ||
      (r.gcash_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.profiles?.email || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusCounts = {
    all: redemptions.length,
    pending: redemptions.filter(r => r.status === "pending").length,
    completed: redemptions.filter(r => r.status === "completed").length,
    rejected: redemptions.filter(r => r.status === "rejected").length,
  };

  if (selectedRedemption) {
    const cust = selectedRedemption.profiles;
    const custName = cust ? `${cust.first_name} ${cust.last_name}` : "Unknown User";
    const custEmail = cust?.email || "N/A";
    const custGrade = cust?.grade_level || "N/A";
    const custSection = cust?.section || "N/A";

    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedRedemption(null)} className="text-xs text-primary font-bold">← Back to Redemptions</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" /> BCoins Redemption
              </h3>
              <p className="text-[10px] text-muted-foreground">{new Date(selectedRedemption.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              selectedRedemption.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
              selectedRedemption.status === 'pending' ? 'bg-warning/20 text-warning' :
              'bg-destructive/20 text-destructive'
            }`}>{selectedRedemption.status.toUpperCase()}</span>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer Information</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">{custName}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{custEmail}</p>
            <p className="text-[10px] text-muted-foreground">{custGrade} • {custSection}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold text-primary block">₱{selectedRedemption.gcash_amount}</span>
              <span className="text-[9px] text-muted-foreground">GCash Amount</span>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold text-warning block">{Number(selectedRedemption.bcoins_amount).toFixed(1)}</span>
              <span className="text-[9px] text-muted-foreground">BCoins Spent</span>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold block">{selectedRedemption.gcash_number}</span>
              <span className="text-[9px] text-muted-foreground">GCash Number</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedRedemption.status === "pending" && (
              <>
                <Button size="sm" onClick={() => updateStatus(selectedRedemption.id, "completed")} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedRedemption.id, "rejected")} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Reject</Button>
              </>
            )}
            {selectedRedemption.status !== "pending" && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(selectedRedemption.id, "pending")} className="gap-1 w-full"><RefreshCw className="h-3 w-3" /> Reopen</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or GCash number..." className="pl-9 text-xs h-9" />
        </div>
      </div>

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

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(r => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Gift className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">
                      {r.profiles?.first_name} {r.profiles?.last_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{r.gcash_number}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
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
              {r.status !== "pending" && (
                <button onClick={() => setSelectedRedemption(r)} className="w-full flex items-center justify-center gap-1 text-[10px] text-primary font-bold py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <Eye className="h-3 w-3" /> View Details
                </button>
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