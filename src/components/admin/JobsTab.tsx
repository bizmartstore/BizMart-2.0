import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Briefcase, RefreshCw, Eye, XCircle, CheckCircle2, Loader2, ListChecks, Target, FileText, MapPin, Clock, User, Wallet, ShieldCheck, Timer, Award } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load all jobs with client info
      const { data: jobsData } = await (supabase as any)
        .from("job_postings")
        .select("*, client:profiles!job_postings_client_id_fkey(*)")
        .order("created_at", { ascending: false });
      setJobs(jobsData || []);

      // 2. Load all sessions with job and freelancer info
      // We use the column name in the join (profiles!freelancer_id) to be safe
      const { data: sessionsData } = await (supabase as any)
        .from("job_sessions")
        .select(`
          *,
          job:job_postings(*),
          freelancer:profiles!freelancer_id(*)
        `)
        .order("created_at", { ascending: false });
      
      // 3. Enrich sessions with client info from the jobsData we already fetched
      const enrichedSessions = (sessionsData || []).map((s: any) => {
        const jobInfo = jobsData?.find(j => j.id === s.job_id);
        return { 
          ...s, 
          client: jobInfo?.client,
          job: jobInfo // Ensure the session has the full job info including client
        };
      });

      setSessions(enrichedSessions);
    } catch (e) {
      console.error("Failed to load jobs/sessions:", e);
    }
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
      toast.error(e.message || "Failed to confirm payment");
    }
    setProcessing(false);
  };

  const handleReview = async (jobId: string, status: "open" | "rejected") => {
    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from("job_postings")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", jobId);
      
      if (error) throw error;
      toast.success(`Job ${status === 'open' ? 'approved and is now live' : 'rejected'}!`);
      setSelectedJob(null);
      load();
    } catch (e: any) {
      toast.error("Failed to update job status");
    }
    setProcessing(false);
  };

  const releaseEscrow = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    setProcessing(true);
    try {
      // 1. Update session status
      await (supabase as any).from("job_sessions").update({ status: "completed" }).eq("id", sessionId);
      
      // 2. Update job status
      await (supabase as any).from("job_postings").update({ status: "completed" }).eq("id", session.job_id);

      // 3. Credit Freelancer BCoins (1 BCoin = 1 Peso)
      const amount = Number(session.escrow_amount);
      
      const { data: wallet } = await (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", session.freelancer_id)
        .maybeSingle();
      
      const newBalance = Number(wallet?.balance || 0) + amount;

      if (wallet) {
        await (supabase as any).from("bcoins_wallets").update({ balance: newBalance }).eq("user_id", session.freelancer_id);
      } else {
        await (supabase as any).from("bcoins_wallets").insert({ user_id: session.freelancer_id, balance: newBalance });
      }

      // 4. Log transaction
      await (supabase as any).from("bcoins_transactions").insert({
        user_id: session.freelancer_id,
        amount: amount,
        type: "earn_job",
        description: `Earnings from job: ${session.job?.title}`,
      });

      toast.success(`Payment of ₱${amount} released to freelancer! 🪙`);
      setSelectedSession(null);
      load();
    } catch (e: any) {
      toast.error("Failed to release escrow");
    }
    setProcessing(false);
  };

  const filteredJobs = jobs.filter(j => 
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || (j.client?.first_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending_payment': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">💰 Awaiting Payment</span>;
      case 'pending_approval': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">⏳ Pending Review</span>;
      case 'open': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">🟢 Live</span>;
      case 'in_progress': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">⏱️ Active</span>;
      case 'pending_review': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">🔍 Reviewing Proof</span>;
      case 'completed': return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✅ Done</span>;
      default: return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{status}</span>;
    }
  };

  if (selectedJob) {
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedJob(null)} className="text-xs text-primary font-bold">← Back to List</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div><h3 className="font-bold text-sm">{selectedJob.title}</h3><p className="text-[10px] text-muted-foreground">Client: {selectedJob.client?.first_name} {selectedJob.client?.last_name}</p></div>
            {getStatusBadge(selectedJob.status)}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted rounded-lg p-2"><span className="text-sm font-extrabold block">₱{selectedJob.hourly_rate}</span><span className="text-[9px] text-muted-foreground">Rate/hr</span></div>
            <div className="bg-muted rounded-lg p-2"><span className="text-sm font-extrabold block">{selectedJob.duration_hours}h</span><span className="text-[9px] text-muted-foreground">Duration</span></div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-2"><span className="text-sm font-extrabold text-primary block">₱{selectedJob.escrow_amount}</span><span className="text-[9px] text-primary font-bold">Total Escrow</span></div>
          </div>
          {selectedJob.status === "pending_payment" && (
            <Button onClick={() => confirmPayment(selectedJob.id)} disabled={processing} className="w-full bg-amber-600 hover:bg-amber-700"><Wallet className="h-4 w-4 mr-2" /> Confirm Cash Received</Button>
          )}
          {selectedJob.status === "pending_approval" && (
            <div className="flex gap-2">
              <Button onClick={() => handleReview(selectedJob.id, "open")} disabled={processing} className="flex-1"><CheckCircle2 className="h-4 w-4 mr-2" /> Approve</Button>
              <Button onClick={() => handleReview(selectedJob.id, "rejected")} variant="destructive" disabled={processing} className="flex-1"><XCircle className="h-4 w-4 mr-2" /> Reject</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedSession(null)} className="text-xs text-primary font-bold">← Back to Sessions</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div><h3 className="font-bold text-sm">{selectedSession.job?.title}</h3><p className="text-[10px] text-muted-foreground">Freelancer: {selectedSession.freelancer?.first_name} {selectedSession.freelancer?.last_name}</p></div>
            {getStatusBadge(selectedSession.status)}
          </div>
          
          <div className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] font-bold text-primary uppercase mb-1">Freelancer Proof</p>
              <p className="text-xs">{selectedSession.freelancer_proof || "No proof submitted yet"}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] font-bold text-secondary uppercase mb-1">Customer Confirmation</p>
              <p className="text-xs">{selectedSession.customer_proof || "No confirmation yet"}</p>
            </div>
          </div>

          {selectedSession.status === "pending_review" && (
            <Button onClick={() => releaseEscrow(selectedSession.id)} disabled={processing} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Award className="h-4 w-4 mr-2" /> Release ₱{selectedSession.escrow_amount} to Freelancer
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs or clients..." className="pl-9 text-xs h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={load}><RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>

      <Tabs defaultValue="postings">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="postings" className="text-xs">Job Postings</TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">Live Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="postings" className="space-y-2">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{job.title}</p>
                <p className="text-[10px] text-muted-foreground">{job.client?.first_name} • ₱{job.escrow_amount}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(job.status)}
                <button onClick={() => setSelectedJob(job)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-2">
          {sessions.map(session => (
            <div key={session.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{session.job?.title}</p>
                <p className="text-[10px] text-muted-foreground">F: {session.freelancer?.first_name} • C: {session.client?.first_name}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(session.status)}
                <button onClick={() => setSelectedSession(session)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {sessions.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No active sessions</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}