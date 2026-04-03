import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Search, Loader2 } from "lucide-react";

export default function BCoinsTab() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("bcoins_redemptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRedemptions(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await (supabase as any).from("bcoins_redemptions").update({ status }).eq("id", id);
      toast.success(`Redemption ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = redemptions.filter(r => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch = !search || r.gcash_number.includes(search);
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GCash number..." className="pl-9 text-xs h-9" />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "pending", "completed", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(r => (
          <div key={r.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-xs">₱{r.gcash_amount} GCash</p>
                <p className="text-[10px] text-muted-foreground">{r.gcash_number} • {r.bcoins_amount} BCoins</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-600' : r.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{r.status}</span>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateStatus(r.id, "completed")} disabled={updating === r.id} className="flex-1 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "rejected")} disabled={updating === r.id} className="flex-1 text-[10px]"><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No redemptions found</p>}
      </div>
    </div>
  );
}