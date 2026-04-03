import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Search } from "lucide-react";

export default function GCashTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data, error } = await (supabase as any).from("gcash_transactions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
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
      await (supabase as any).from("gcash_transactions").update({ status }).eq("id", id);
      toast.success(`Transaction ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = transactions.filter(t => {
    const matchFilter = filter === "all" || t.status === filter;
    const matchSearch = !search || t.gcash_number.includes(search) || t.reference_number?.includes(search);
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GCash or Ref..." className="pl-9 text-xs h-9" />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "pending", "completed", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(t => (
          <div key={t.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-xs capitalize">{t.type.replace("_", " ")} - ₱{t.amount}</p>
                <p className="text-[10px] text-muted-foreground">{t.gcash_number} • Ref: {t.reference_number}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-green-100 text-green-600' : t.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{t.status}</span>
            </div>
            {t.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateStatus(t.id, "completed")} disabled={updating === t.id} className="flex-1 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(t.id, "rejected")} disabled={updating === t.id} className="flex-1 text-[10px]"><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No transactions found</p>}
      </div>
    </div>
  );
}