import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RefreshCw, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { sendNotification, notifyCustomerBCoins } from "@/lib/notifications";

export default function GCashTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: txData, error } = await (supabase as any)
        .from("gcash_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const userIds = txData?.map((t: any) => t.user_id).filter(Boolean) || [];
      let enriched = txData || [];
      
      if (userIds.length > 0) {
        const { data: profs } = await (supabase as any)
          .from("profiles")
          .select("user_id, first_name, last_name, email")
          .in("user_id", userIds);
        
        const profileMap = new Map(profs?.map((p: any) => [p.user_id, p]));
        enriched = txData.map((t: any) => ({
          ...t,
          profiles: profileMap.get(t.user_id) || null,
        }));
      }
      
      setTransactions(enriched);
    } catch (e: any) {
      console.error("Failed to load transactions:", e);
      toast.error("Failed to load transactions: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const { data: tx } = await (supabase as any)
        .from("gcash_transactions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (!tx) {
        toast.error("Transaction not found");
        return;
      }

      await (supabase as any)
        .from("gcash_transactions")
        .update({ status })
        .eq("id", id);

      // Award BCoins when GCash transaction is completed
      if (status === "completed" && tx.user_id) {
        await notifyCustomerBCoins(tx.user_id, 1, "GCash transaction completed");
      }

      await sendNotification({
        title: `💳 GCash ${tx.type === 'cash_in' ? 'In' : 'Out'} ${status.toUpperCase()}`,
        message: `Your ₱${tx.amount} ${tx.type.replace('_', ' ')} request has been ${status}.`,
        type: "gcash_status",
        userId: tx.user_id,
        link: "/gcash",
        icon: "💳"
      });

      toast.success(`Transaction ${status}!`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? transactions : transactions.filter(t => t.status === filter);
  const statusCounts = {
    all: transactions.length,
    pending: transactions.filter(t => t.status === "pending").length,
    completed: transactions.filter(t => t.status === "completed").length,
    rejected: transactions.filter(t => t.status === "rejected").length,
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
          {filtered.map(tx => (
            <div key={tx.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {tx.type === "cash_in" ? (
                    <ArrowDownCircle className="h-5 w-5 text-[hsl(var(--success))]" />
                  ) : (
                    <ArrowUpCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-bold text-xs">
                      {tx.profiles?.first_name} {tx.profiles?.last_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tx.gcash_number} → {tx.admin_gcash_number}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  tx.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                  tx.status === 'pending' ? 'bg-warning/20 text-warning' :
                  'bg-destructive/20 text-destructive'
                }`}>
                  {tx.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-sm font-extrabold block">₱{Number(tx.amount).toFixed(2)}</span>
                  <span className="text-[9px] text-muted-foreground">Amount</span>
                </div>
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-sm font-extrabold block">₱{Number(tx.service_fee).toFixed(2)}</span>
                  <span className="text-[9px] text-muted-foreground">Fee</span>
                </div>
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-sm font-extrabold block">₱{Number(tx.total).toFixed(2)}</span>
                  <span className="text-[9px] text-muted-foreground">Total</span>
                </div>
              </div>
              {tx.reference_number && (
                <p className="text-[10px] text-muted-foreground mb-2">Ref: {tx.reference_number}</p>
              )}
              {tx.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(tx.id, "completed")}
                    disabled={updating === tx.id}
                    className="gap-1 flex-1"
                  >
                    {updating === tx.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(tx.id, "rejected")}
                    disabled={updating === tx.id}
                    className="gap-1 flex-1"
                  >
                    {updating === tx.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">No GCash transactions found</p>
          )}
        </div>
      )}
    </div>
  );
}