import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Briefcase, RefreshCw, Eye, XCircle, CheckCircle2, Loader2, ListChecks, Target, FileText, MapPin, Clock, User, Wallet, ShieldCheck } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function JobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("job_postings").select("*, client:profiles!job_postings_client_id_fkey(*)").order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const confirmPayment = async (jobId: string) => {
    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from("job_postings")
        .update({ status: "pending_approval", updated_at: new Date().toISOString() })
        .eq("id", jobId);
      
      if (error) throw error;
      toast.success("Payment confirmed! Job moved to approval queue.");
      setSelectedJob(null);
      load();
    } catch (e: any) {
      console.error("Payment confirmation error:", e);
      toast.error(e.message || "Failed to confirm payment");
    }
    setProcessing(false);
  };

  const handleReview = async (jobId: string, status: "approved" | "rejected") => {
    setProcessing(true);
    try {
      // Simplified update to prevent 400 errors from missing columns or constraints
      const { error } = await (supabase as any)
        .from("job_postings")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", jobId);
      
      if (error) throw error;
      
      toast.success(`Job ${status === 'approved' ? 'approved' : 'rejected'}!`);
      setReviewNotes("");
      setSelectedJob(null);
      load();
    } catch (e: any) {
      console.error("Review error:", e);
      toast.error(e.message || "Failed to update job status");
    }
    setProcessing(false);
  };

  const filtered = jobs.filter(j => 
    !search || 
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.category.toLowerCase().includes(search.toLowerCase()) ||
    (j.client?.first_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending_payment': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">💰 Awaiting Payment</span>;
      case 'pending_approval': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⏳ Pending Review</span>;
      case 'approved': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">✅ Approved</span>;
      case 'ready_to_start': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">💰 Ready</span>;
      case 'open': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">🟢 Open</span>;
      case 'in_progress': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">⏱️ Active</span>;
      case 'completed': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✅ Done</span>;
      case 'rejected': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">❌ Rejected</span>;
      default: return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{status}</span>;
    }
  };

  if (selectedJob) {
    const needsPayment = selectedJob.status === "pending_payment";
    const needsReview = selectedJob.status === "pending_approval";

    return (
      <div className="space-y-3">
        <button onClick={() => { setSelectedJob(null); setReviewNotes(""); }} className="text-xs text-primary font-bold">← Back to Jobs</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">{selectedJob.title}</h3>
              <p className="text-[10px] text-muted-foreground">{selectedJob.client?.first_name} {selectedJob.client?.last_name} • {new Date(selectedJob.created_at).toLocaleString()}</p>
            </div>
            {getStatusBadge(selectedJob.status)}
          </div>

          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</p>
            <p className="text-xs whitespace-pre-wrap">{selectedJob.description}</p>
          </div>

          {selectedJob.instructions && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><ListChecks className="h-3 w-3" /> Step-by-Step Instructions</p>
              <p className="text-xs whitespace-pre-wrap">{selectedJob.instructions}</p>
            </div>
          )}

          {selectedJob.expected_output && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Target className="h-3 w-3" /> Expected Output</p>
              <p className="text-xs whitespace-pre-wrap">{selectedJob.expected_output}</p>
            </div>
          )}

          {selectedJob.requirements && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><FileText className="h-3 w-3" /> Specific Requirements</p>
              <p className="text-xs whitespace-pre-wrap">{selectedJob.requirements}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted rounded-lg p-2"><span className="text-sm font-extrabold block">₱{selectedJob.hourly_rate}</span><span className="text-[9px] text-muted-foreground">Budget</span></div>
            <div className="bg-muted rounded-lg p-2"><span className="text-sm font-extrabold block">{selectedJob.category}</span><span className="text-[9px] text-muted-foreground">Category</span></div>
            <div className="bg-muted rounded-lg p-2"><span className="text-sm font-extrabold block">{selectedJob.location}</span><span className="text-[9px] text-muted-foreground">Location</span></div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {selectedJob.location}
            <Clock className="h-3 w-3 ml-2" /> Expires: {new Date(selectedJob.expires_at).toLocaleString()}
          </div>

          {/* Payment Confirmation Step */}
          {needsPayment && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-bold text-amber-700">Payment Not Yet Received</p>
                </div>
                <p className="text-[10px] text-amber-600">Client must hand over ₱{selectedJob.hourly_rate} to BizMart staff before this job can be reviewed.</p>
              </div>
              <Button size="sm" onClick={() => confirmPayment(selectedJob.id)} disabled={processing} className="w-full gap-1 bg-amber-600 hover:bg-amber-700">
                <Wallet className="h-3 w-3" /> Confirm Payment Received
              </Button>
            </div>
          )}

          {/* Admin Review Step */}
          {needsReview && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-bold">Admin Review Notes (Optional)</p>
              <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Add notes for the client..." className="text-xs" rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleReview(selectedJob.id, "approved")} disabled={processing} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => handleReview(selectedJob.id, "rejected")} disabled={processing} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Reject</Button>
              </div>
            </div>
          )}

          {selectedJob.admin_notes && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Admin Notes</p>
              <p className="text-xs whitespace-pre-wrap">{selectedJob.admin_notes}</p>
            </div>
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
              {getStatusBadge(job.status)}
              <button onClick={() => setSelectedJob(job)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No jobs found</p>}
      </div>
    </div>
  );
}