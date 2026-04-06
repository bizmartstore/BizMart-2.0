import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, MapPin, Star, CheckCircle2, XCircle, Loader2, FileText, User, Timer, Calendar, Wallet, Play, Square, Upload, Target, AlertCircle, ListChecks, Info } from "lucide-react";
import { sendNotification } from "@/lib/notifications";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [bidForm, setBidForm] = useState({ price: "", message: "", contactNumber: "" });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [freelancerProof, setFreelancerProof] = useState("");
  const [customerProof, setCustomerProof] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [myBidStatus, setMyBidStatus] = useState<string | null>(null);
  const [isFreelancer, setIsFreelancer] = useState(false);

  const loadJobData = async () => {
    if (!id) return;
    try {
      const { data: jobData, error: jobError } = await (supabase as any)
        .from("job_postings")
        .select("*, client:profiles!job_postings_client_id_fkey(*)")
        .eq("id", id)
        .maybeSingle();
      if (jobError) throw jobError;
      setJob(jobData);

      const { data: bidsData } = await (supabase as any)
        .from("job_bids")
        .select("*, freelancer:profiles!job_bids_freelancer_id_fkey(*)")
        .eq("job_id", id)
        .order("created_at", { ascending: false });
      setBids(bidsData || []);

      const { data: sessionData } = await (supabase as any)
        .from("job_sessions")
        .select("*")
        .eq("job_id", id)
        .maybeSingle();
      setSession(sessionData);

      if (user) {
        const { data: freelancer } = await (supabase as any)
          .from("freelancer_profiles")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsFreelancer(freelancer?.status === "approved");
        if (bidsData) {
          const myBid = bidsData.find((b: any) => b.freelancer_id === user.id);
          setMyBidStatus(myBid ? myBid.status : null);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobData(); }, [id, user]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`job-detail-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_postings", filter: `id=eq.${id}` }, (p: any) => { if (p.new) setJob(p.new); })
      .on("postgres_changes", { event: "*", schema: "public", table: "job_bids", filter: `job_id=eq.${id}` }, () => loadJobData())
      .on("postgres_changes", { event: "*", schema: "public", table: "job_sessions", filter: `job_id=eq.${id}` }, (p: any) => { if (p.new) setSession(p.new); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.status === "active" && session?.start_time) {
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000);
        setSessionTimer(elapsed);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [session?.status, session?.start_time]);

  const isFullyReviewed = useMemo(() => !!session?.freelancer_proof_submitted_at && !!session?.customer_proof_submitted_at, [session]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleBid = async () => {
    if (!user || !job) return;
    const price = Number(bidForm.price);
    if (price < job.min_price || price > job.max_price) { toast.error(`Bid must be between ₱${job.min_price} and ₱${job.max_price}`); return; }
    setSubmittingBid(true);
    try {
      await (supabase as any).from("job_bids").insert({ job_id: job.id, freelancer_id: user.id, proposed_price: price, message: bidForm.message.trim(), contact_number: bidForm.contactNumber.trim(), status: "pending" });
      toast.success("Bid submitted! 📝");
      setBidForm({ price: "", message: "", contactNumber: "" });
      loadJobData();
    } catch (err: any) { toast.error("Failed to submit bid"); }
    setSubmittingBid(false);
  };

  const handleHire = async (bidId: string, freelancerId: string, price: number) => {
    try {
      // 1. Create session first to ensure it exists
      const { error: sessionError } = await (supabase as any).from("job_sessions").insert({ 
  job_id: job.id, 
  customer_id: job.client_id, // ✅ ADD THIS
  freelancer_id: freelancerId, 
  status: "scheduled", 
  escrow_amount: price 
});
      if (sessionError) throw sessionError;

      // 2. Update job status
      await (supabase as any).from("job_postings").update({ 
        status: "ready_to_start", 
        hired_freelancer_id: freelancerId 
      }).eq("id", job.id);

      // 3. Update bid status
      await (supabase as any).from("job_bids").update({ status: "accepted" }).eq("id", bidId);
      
      toast.success("Freelancer hired! 🤝");
      loadJobData();
    } catch (err: any) { 
      console.error("Hire error:", err);
      toast.error("Failed to hire freelancer: " + err.message); 
    }
  };

  const startSession = async () => {
  if (!job) return;

  try {
    let currentSession = session;

    // 🔥 Always ensure we have the correct session
    if (!currentSession) {
      const { data: sessions, error } = await (supabase as any)
        .from("job_sessions")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!sessions || sessions.length === 0) {
        toast.error("Session data not found. Please refresh the page.");
        await loadJobData();
        return;
      }

      currentSession = sessions[0];
      setSession(currentSession);
    }

    // 🔥 Prevent duplicate start
    if (currentSession.status === "active") {
      toast.info("Session already started");
      return;
    }

    // 🔥 Start session
    const { error: sessionError } = await (supabase as any)
      .from("job_sessions")
      .update({
        status: "active",
        start_time: new Date().toISOString(),
      })
      .eq("id", currentSession.id);

    if (sessionError) throw sessionError;

    // 🔥 Update job status
    const { error: jobError } = await (supabase as any)
      .from("job_postings")
      .update({ status: "in_progress" })
      .eq("id", job.id);

    if (jobError) throw jobError;

    toast.success("Session started! ⏱️");

    await loadJobData();

  } catch (err: any) {
    console.error("Start session error:", err);
    toast.error("Failed to start session: " + err.message);
  }
};

  const endSession = async () => {
  if (!session || !job) return;

  try {
    // 🔥 Prevent invalid state
    if (session.status !== "active") {
      toast.info("Session is not active");
      return;
    }

    // 🔥 End session
    const { error: sessionError } = await (supabase as any)
      .from("job_sessions")
      .update({
        status: "pending_review",
        end_time: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (sessionError) throw sessionError;

    // 🔥 Update job status
    const { error: jobError } = await (supabase as any)
      .from("job_postings")
      .update({ status: "pending_review" })
      .eq("id", job.id);

    if (jobError) throw jobError;

    toast.success("Session ended! Please submit proof.");

    await loadJobData();

  } catch (err: any) {
    console.error("End session error:", err);
    toast.error("Failed to end session: " + err.message);
  }
};

  const submitProof = async (role: "freelancer" | "customer") => {
    const proofText = role === "freelancer" ? freelancerProof : customerProof;
    if (!proofText.trim()) { toast.error("Please describe the work completed"); return; }
    setUploadingProof(true);
    try {
      const updateData: any = role === "freelancer" ? { freelancer_proof: proofText, freelancer_proof_submitted_at: new Date().toISOString() } : { customer_proof: proofText, customer_proof_submitted_at: new Date().toISOString() };
      await (supabase as any).from("job_sessions").update(updateData).eq("id", session.id);
      toast.success(`${role} proof submitted!`);
      loadJobData();
    } catch { toast.error("Failed to submit proof"); }
    setUploadingProof(false);
    if (role === "freelancer") setFreelancerProof(""); else setCustomerProof("");
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!job) return <div className="p-8 text-center">Job not found</div>;

  const isClient = user?.id === job.client_id;
  const isHiredFreelancer = user?.id === job.hired_freelancer_id;
  const canBid = !isClient && (job.status === "open" || job.status === "approved") && !myBidStatus && isFreelancer;
  
  const canStartSession = isClient && (session?.status === "scheduled" || job.status === "ready_to_start");
  const canEndSession = isClient && (session?.status === "active" || job.status === "in_progress");
  
  const showProofSubmission = (isHiredFreelancer || isClient) && (session?.status === "pending_review" || job.status === "pending_review") && !isFullyReviewed;
  const showSessionDetails = session && (session.status === "active" || session.status === "pending_review" || (session.status === "completed" && !isFullyReviewed));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 text-center"><h1 className="text-lg font-bold">Job Details</h1></div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Main Job Card */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="font-bold text-base">{job.title}</h2>
              <p className="text-xs text-muted-foreground">Posted by {job.client?.first_name} {job.client?.last_name}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${job.status === "open" || job.status === "approved" ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>{job.status.replace("_", " ").toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-sm font-extrabold text-primary">₱{job.hourly_rate}/hr</p><p className="text-[8px] text-muted-foreground">Rate</p></div>
            <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-sm font-extrabold text-secondary">{job.duration_hours}h</p><p className="text-[8px] text-muted-foreground">Duration</p></div>
            <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-sm font-extrabold text-emerald-600">₱{job.escrow_amount}</p><p className="text-[8px] text-muted-foreground">Total</p></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /><span>{job.location}</span></div>
        </div>

        {/* Detailed Information Section */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-5 shadow-sm">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-foreground">
              <Info className="h-4 w-4 text-primary" /> Job Description
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.instructions && (
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-foreground">
                <ListChecks className="h-4 w-4 text-primary" /> Step-by-Step Instructions
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.instructions}</p>
            </div>
          )}

          {job.expected_output && (
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-foreground">
                <Target className="h-4 w-4 text-primary" /> Expected Output
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.expected_output}</p>
            </div>
          )}

          {job.requirements && (
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-2 text-foreground">
                <FileText className="h-4 w-4 text-primary" /> Requirements
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}
        </div>

        {/* Session Controls */}
        {showSessionDetails && (
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Session Details</h3>
            {session.status === "active" && (
              <div className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>
                    <p className="text-xs font-bold text-primary uppercase">Session Active</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary mt-1">{formatTime(sessionTimer)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Target Duration: {job.duration_hours} Hours</p>
                </div>
                {canEndSession && <Button onClick={endSession} className="w-full gap-2 bg-destructive hover:bg-destructive/90"><Square className="h-4 w-4" />End Session</Button>}
              </div>
            )}
            {session.status === "pending_review" && (
              <div className="space-y-4">
                {session.freelancer_proof && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Freelancer Proof</p>
                    <p className="text-xs">{session.freelancer_proof}</p>
                  </div>
                )}
                {session.customer_proof && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Customer Confirmation</p>
                    <p className="text-xs">{session.customer_proof}</p>
                  </div>
                )}

                {isHiredFreelancer && !session.freelancer_proof_submitted_at && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <Label className="text-xs font-bold mb-2 block">Submit Work Proof</Label>
                    <Textarea value={freelancerProof} onChange={(e) => setFreelancerProof(e.target.value)} placeholder="Describe the work completed..." className="text-xs mb-2" rows={3} />
                    <Button onClick={() => submitProof("freelancer")} disabled={uploadingProof} className="w-full text-xs">Submit Proof</Button>
                  </div>
                )}
                {isClient && !session.customer_proof_submitted_at && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <Label className="text-xs font-bold mb-2 block">Confirm Completion</Label>
                    <Textarea value={customerProof} onChange={(e) => setCustomerProof(e.target.value)} placeholder="Confirm the work was completed..." className="text-xs mb-2" rows={3} />
                    <Button onClick={() => submitProof("customer")} disabled={uploadingProof} className="w-full text-xs">Confirm Completion</Button>
                  </div>
                )}
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700">Admin will review the proofs and release the payment once verified.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {canStartSession && (
          <div className="bg-card rounded-xl border border-border p-4 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto"><Play className="h-6 w-6 text-green-600 fill-green-600" /></div>
            <div><h3 className="font-bold text-sm">Start Session</h3><p className="text-[10px] text-muted-foreground">Only you (the client) can start the timer.</p></div>
            <Button onClick={startSession} className="w-full gap-2 bg-green-600 hover:bg-green-700"><Play className="h-4 w-4" />Start Session Now</Button>
          </div>
        )}

        {isHiredFreelancer && session?.status === "scheduled" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center shadow-sm">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-blue-800">Waiting for client to start session</p>
            <p className="text-[10px] text-blue-600 mt-1">The timer will appear here once the client starts the session.</p>
          </div>
        )}

        {canBid ? (
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h3 className="font-bold text-sm mb-3">Submit Your Bid</h3>
            <div className="space-y-3">
              <div><Label className="text-xs">Proposed Hourly Rate (₱{job.min_price}-₱{job.max_price})</Label><Input type="number" value={bidForm.price} onChange={(e) => setBidForm({...bidForm, price: e.target.value})} className="text-xs h-9 mt-1" /></div>
              <div><Label className="text-xs">Contact Number</Label><Input value={bidForm.contactNumber} onChange={(e) => setBidForm({...bidForm, contactNumber: e.target.value})} className="text-xs h-9 mt-1" /></div>
              <div><Label className="text-xs">Your Approach</Label><Textarea value={bidForm.message} onChange={(e) => setBidForm({...bidForm, message: e.target.value})} className="text-xs mt-1" rows={3} /></div>
              <Button onClick={handleBid} disabled={submittingBid} className="w-full h-10 text-xs font-bold">Submit Bid</Button>
            </div>
          </div>
        ) : null}

        {bids.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h3 className="font-bold text-sm mb-3">Bids ({bids.length})</h3>
            <div className="space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div><p className="font-bold text-xs">{bid.freelancer?.first_name} {bid.freelancer?.last_name}</p><p className="text-[10px] text-muted-foreground">₱{bid.proposed_price}/hr</p></div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${bid.status === "accepted" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>{bid.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{bid.message}</p>
                  {isClient && bid.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleHire(bid.id, bid.freelancer_id, bid.proposed_price)} className="flex-1 text-xs h-8">Hire</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}