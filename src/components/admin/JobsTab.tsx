import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Briefcase, RefreshCw, Eye, XCircle } from "lucide-react";

export default function JobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("job_postings").select("*, client:profiles!job_postings_client_id_fkey(*)").order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeJob = async (id: string) => {
    await (supabase as any).from("job_postings").update({ status: "closed" }).eq("id", id);
    toast.success("Job closed");
    load();
  };

  const filtered = jobs.filter(j => 
    !search || 
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.category.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedJob) {
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedJob(null)} className="text-xs text-primary font-bold">← Back to Jobs</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">{selectedJob.title}</h3>
              <p className="text-[10px] text-muted-foreground">{selectedJob.client?.first_name} {selectedJob.client?.last_name} • {new Date(selectedJob.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              selectedJob.status === 'open' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'
            }`}>{selectedJob.status}</span>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground">DESCRIPTION</p>
            <p className="text-xs whitespace-pre-wrap">{selectedJob.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold block">₱{selectedJob.hourly_rate}</span>
              <span className="text-[9px] text-muted-foreground">Rate/hr</span>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold block">{selectedJob.category}</span>
              <span className="text-[9px] text-muted-foreground">Category</span>
            </div>
            <div className="bg-muted rounded-lg p-2">
              <span className="text-sm font-extrabold block">{selectedJob.location}</span>
              <span className="text-[9px] text-muted-foreground">Location</span>
            </div>
          </div>
          {selectedJob.status === "open" && (
            <Button size="sm" variant="destructive" onClick={() => closeJob(selectedJob.id)} className="gap-1 w-full"><XCircle className="h-3 w-3" /> Close Job</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..." className="pl-9 text-xs h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(job => (
          <div key={job.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-bold text-xs truncate">{job.title}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{job.client?.first_name} {job.client?.last_name} • ₱{job.hourly_rate}/hr</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                job.status === 'open' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'
              }`}>{job.status}</span>
              <button onClick={() => setSelectedJob(job)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No jobs found</p>}
      </div>
    </div>
  );
}