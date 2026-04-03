import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Briefcase, Loader2, Search } from "lucide-react";

export default function JobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data, error } = await (supabase as any).from("job_postings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setJobs(data || []);
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
      await (supabase as any).from("job_postings").update({ status }).eq("id", id);
      toast.success(`Job ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = jobs.filter(j => {
    const matchFilter = filter === "all" || j.status === filter;
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." className="pl-9 text-xs h-9" />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", "open", "closed", "filled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(j => (
          <div key={j.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><Briefcase className="h-4 w-4 text-primary" /></div>
                <div>
                  <p className="font-bold text-xs">{j.title}</p>
                  <p className="text-[10px] text-muted-foreground">₱{j.hourly_rate}/hr • {j.location}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${j.status === 'open' ? 'bg-green-100 text-green-600' : j.status === 'closed' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{j.status}</span>
            </div>
            {j.status === "open" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateStatus(j.id, "closed")} disabled={updating === j.id} className="flex-1 text-[10px]"><XCircle className="h-3 w-3 mr-1" /> Close Job</Button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No jobs found</p>}
      </div>
    </div>
  );
}