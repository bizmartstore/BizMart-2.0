import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, MapPin, Star, CheckCircle2, XCircle, Loader2, FileText, User, Timer, Calendar, Wallet, Play, Square, Upload, Target, AlertCircle } from "lucide-react";
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

  // Load job, bids, and session data
  const loadJobData = async () => {
    if (!id) return;
    
    try {
      // Load job details
      const { data: jobData, error: jobError } = await (supabase as any)
        .from("job_postings")
        .select("*, client:profiles!job_postings_client_id_fkey(*)")
        .eq("id", id)
        .maybeSingle();
      
      if (jobError) throw jobError;
      setJob(jobData);

      // Load bids
      const { data: bidsData, error: bidsError } = await (supabase as any)
        .from("job_bids")
        .select("*, freelancer:profiles!job_bids_freelancer_id_fkey(*)")
        .eq("job_id", id)
        .order("created_at", { ascending: false });
      
      if (bidsError) {
        console.error("Failed to fetch bids:", bidsError);
        setBids([]);
      } else {
        setBids(bidsData || []);
      }

      // Load session
      const { data: sessionData, error: sessionError } = await (supabase as any)
        .from("job_sessions")
        .select("*")
        .eq("job_id", id)
        .maybeSingle();
      
      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Check if current user is a freelancer and if they have bid
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
      console.error("Failed to load job data:", err);
      toast.error(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadJobData();
  }, [id, user]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`job-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_postings", filter: `id=eq.${id}` },
        (payload: any) => { if (payload.new) setJob(payload.new); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_bids", filter: `job_id=eq.${id}` },
        () => loadJobData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_sessions", filter: `job_id=eq.${id}` },
        (payload: any) => { if (payload.new) setSession(payload.new); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Session timer logic
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

  const isFullyReviewed = useMemo(() => {
    return !!session?.freelancer_proof_submitted_at && !!session?.customer_proof_submitted_at;
  }, [session]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleBid = async () => {
    if (!user || !job) return;
    const price = Number(bidForm.price);
    if (price < job.min_price || price > job.max_price) {
      toast.error(`Bid must be between ₱${job.min_price} and ₱${job.max_price}`);
      return;
    }
    if (!bidForm.message.trim() || !bidForm.contactNumber.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setSubmittingBid(true);
    try {
      const { error } = await (supabase as any).from("job_bids").insert({
        job_id: job.id,
        freelancer_id: user.id,
        proposed_price: price,
        message: bidForm.message.trim(),
        contact_number: bidForm.contactNumber.trim(),
        status: "pending",
      });
      if (error) throw error;
      toast.success("Bid submitted successfully! 📝");
      setBidForm({ price: "", message: "", contactNumber: "" });
      loadJobData();
      await sendNotification({
        title: "📝 New Bid Received",
        message: `A freelancer placed a bid of ₱${price} on your job "${job.title}".`,
        type: "new_bid",
        userId: job.client_id,
        link: `/jobs/${job.id}`,
        icon: "📝",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit bid");
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleHire = async (bidId: string, freelancerId: string, price: number) => {
    try {
      await (supabase as any).from("job_postings").update({ status: "ready_to_start", hired_freelancer_id: freelancerId }).eq("id", job.id);
      await (supabase as any).from("job_bids").update({ status: "accepted" }).eq("id", bidId);
      await (supabase as any).from("job_sessions").insert({ job_id: job.id, freelancer_id: freelancerId, status: "scheduled", escrow_amount: price });
      await sendNotification({
        title: "🎉 You Were Hired!",
        message: `Client selected you for "${job.title}". Check the job details to start the session.`,
        type: "freelancer_hired",
        userId: freelancerId,
        link: `/jobs/${job.id}`,
        icon: "🎉",
      });
      toast.success("Freelancer hired! Session scheduled. 🤝");
      loadJobData();
    } catch (err: any) {
      toast.error("Failed to hire freelancer");
    }
  };

  const handleRejectBid = async (bidId: string, freelancerId: string) => {
    try {
      await (supabase as any).from("job_bids").update({ status: "rejected" }).eq("id", bidId);
      await sendNotification({
        title: "💪 Keep Up the Great Work!",
        message: `The client chose another freelancer for "${job?.title}" this time.`,
        type: "freelancer_rejected",
        userId: freelancerId,
        link: "/jobs",
        icon: "💪",
      });
      toast.success("Bid rejected");
      loadJobData();
    } catch (err: any) {
      toast.error("Failed to reject bid");
    }
  };

  const startSession = async () => {
    try {
      await (supabase as any).from("job_sessions").update({ status: "active", start_time: new Date().toISOString() }).eq("id", session.id);
      await (supabase as any).from("job_postings").update({ status: "in_progress" }).eq("id", job.id);
      toast.success("Session started! ⏱️ Timer is running.");
      loadJobData();
    } catch (err: any) {
      toast.error("Failed to start session");
    }
  };

  const endSession = async () => {
    try {
      await (supabase as any).from("job_sessions").update({ status: "pending_review", end_time: new Date().toISOString() }).eq("id", session.id);
      await (supabase as any).from("job_postings").update({ status: "pending_review" }).eq("id", job.id);
      toast.success("Session ended! Please submit proof of completion.");
      loadJobData();
    } catch (err: any) {
      toast.error("Failed to end session");
    }
  };

  const submitProof = async (role: "freelancer" | "customer") => {
    const proofText = role === "freelancer" ? freelancerProof : customerProof;
    if (!proofText.trim()) { toast.error("Please describe the work completed"); return; }
    setUploadingProof(true);
    try {
      const updateData: any = {};
      if (role === "freelancer") {
        updateData.freelancer_proof = proofText;
        updateData.freelancer_proof_submitted_at = new Date().toISOString();
      } else {
        updateData.customer_proof = proofText;
        updateData.customer_proof_submitted_at = new Date().toISOString();
      }
      await (supabase as any).from("job_sessions").update(updateData).eq("id", session.id);
      toast.success(`${role} proof submitted!`);
      loadJobData();
    } catch (err: any) {
      toast.error("Failed to submit proof");
    } finally {
      setUploadingProof(false);
      if (role === "freelancer") setFreelancerProof(""); else setCustomerProof("");
    }
  };

  const renderProofContent = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (line.startsWith("http") && (line.includes(".jpg") || line.includes(".png") || line.includes(".jpeg") || line.includes(".webp"))) {
        return <img key={i} src={line} alt="Proof" className="w-full max-h-48 object-contain rounded-lg border border-border mt-2" />;
      }
      return <p key={i} className="text-xs text-foreground whitespace-pre-wrap">{line}</p>;
    });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!job) return <div className="min-h-screen bg-background pb-20"><TopBar /><div className="flex flex-col items-center justify-center px-6 mt-20 text-center"><FileText className="h-16 w-16 text-muted-foreground/30 mb-4" /><h2 className="font-extrabold text-xl mb-2">Job Not Found</h2><Button onClick={() => navigate("/jobs")} className="w-full max-w-xs h-12 font-bold rounded-xl">Back to Jobs</Button></div><BottomNav /></div>;

  const isClient = user?.id === job.client_id;
  const isHiredFreelancer = user?.id === job.hired_freelancer_id;
  const canBid = !isClient && (job.status === "open" || job.status === "approved") && !myBidStatus && isFreelancer;
  
  // FIX: Allow both client and freelancer to start/end session
  const canStartSession = (isHiredFreelancer || isClient) && session?.status === "scheduled";
  const canEndSession = (isHiredFreelancer || isClient) && session?.status === "active";
  
  const showProofSubmission = (isHiredFreelancer || isClient) && session?.status === "pending_review" && !isFullyReviewed;
  const showSessionDetails = session && (session.status === "active" || session.status === "pending_review" || (session.status === "completed" && !isFullyReviewed));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 text-center"><h1 className="text-lg font-bold">Job Details</h1></div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex justify-between items-start mb-3">
            <div><h2 className="font-bold text-base">{job.title}</h2><p className="text-xs text-muted-foreground">Posted by {job.client?.first_name} {job.client?.last_name}</p></div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              job.status === "open" || job.status === "approved" ? "bg-green-100 text-green-600" :
              job.status === "pending_payment" ? "bg-amber-100 text-amber-600" :
              job.status === "pending_approval" ? "bg-yellow-100 text-yellow-600" :
              job.status === "in_progress" ? "bg-blue-100 text-blue-600" :
              "bg-muted text-muted-foreground"
            }`}>{job.status.replace("_", " ").toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-lg font-extrabold text-primary">₱{job.hourly_rate}</p><p className="text-[9px] text-muted-foreground">Budget</p></div>
            <div className="bg-muted/30 rounded-lg p-2 text-center"><p className="text-lg font-extrabold text-secondary">{job.category}</p><p className="text-[9px] text-muted-foreground">Category</p></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><MapPin className="h-3 w-3" /><span>{job.location}</span></div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /><span>Needed: {new Date(job.expires_at).toLocaleString()}</span></div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4"><h3 className="font-bold text-sm mb-2">Description</h3><p className="text-xs text-muted-foreground">{job.description}</p></div>

        {showSessionDetails && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Session Details</h3>
            {session.status === "active" && (
              <div className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <p className="text-xs font-bold text-primary uppercase">Session Active</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary mt-1">{formatTime(sessionTimer)}</p>
                </div>
                {canEndSession && (
                  <Button onClick={endSession} className="w-full gap-2 bg-destructive hover:bg-destructive/90"><Square className="h-4 w-4" />End Session</Button>
                )}
              </div>
            )}
            {session.status === "pending_review" && !isFullyReviewed && (
              <div className="space-y-4">
                {isHiredFreelancer && !session.freelancer_proof_submitted_at && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <Label className="text-xs font-bold mb-2 block">Submit Work Proof</Label>
                    <Textarea value={freelancerProof} onChange={(e) => setFreelancerProof(e.target.value)} placeholder="Describe the work completed..." className="text-xs mb-2" rows={3} />
                    <Button onClick={() => submitProof("freelancer")} disabled={uploadingProof || !freelancerProof.trim()} className="w-full text-xs">Submit Proof</Button>
                  </div>
                )}
                {isClient && !session.customer_proof_submitted_at && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <Label className="text-xs font-bold mb-2 block">Confirm Completion</Label>
                    <Textarea value={customerProof} onChange={(e) => setCustomerProof(e.target.value)} placeholder="Confirm the work was completed..." className="text-xs mb-2" rows={3} />
                    <Button onClick={() => submitProof("customer")} disabled={uploadingProof || !customerProof.trim()} className="w-full text-xs">Confirm Completion</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bid Form */}
        {canBid ? (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-3">Submit Your Bid</h3>
            <div className="space-y-3">
              <div><Label className="text-xs">Proposed Price (₱{job.min_price} - ₱{job.max_price})</Label><Input type="number" value={bidForm.price} onChange={(e) => setBidForm({...bidForm, price: e.target.value})} placeholder={`₱${job.min_price} - ₱${job.max_price}`} className="text-xs h-9 mt-1" /></div>
              <div><Label className="text-xs">Contact Number</Label><Input value={bidForm.contactNumber} onChange={(e) => setBidForm({...bidForm, contactNumber: e.target.value})} placeholder="09XXXXXXXXX" className="text-xs h-9 mt-1" /></div>
              <div><Label className="text-xs">Your Approach</Label><Textarea value={bidForm.message} onChange={(e) => setBidForm({...bidForm, message: e.target.value})} placeholder="Describe how you'll complete this job..." className="text-xs mt-1" rows={3} /></div>
              <Button onClick={handleBid} disabled={submittingBid} className="w-full h-10 text-xs font-bold">{submittingBid && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Submit Bid</Button>
            </div>
          </div>
        ) : !isClient && (job.status === "open" || job.status === "approved") && !myBidStatus && !isFreelancer && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Freelancer Account Required</p>
              <p className="text-[10px] text-amber-700 mt-1">You must be an approved BizMart Freelancer to bid on jobs. Apply now to start earning!</p>
              <Button onClick={() => navigate("/jobs/apply")} size="sm" variant="outline" className="mt-2 h-7 text-[10px] border-amber-300 text-amber-800 hover:bg-amber-100">Apply to be a Freelancer</Button>
            </div>
          </div>
        )}

        {canStartSession && (
          <div className="bg-card rounded-xl border border-border p-4 text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Play className="h-6 w-6 text-green-600 fill-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Ready to Start?</h3>
              <p className="text-[10px] text-muted-foreground">Both parties can now start the session timer.</p>
            </div>
            <Button onClick={startSession} className="w-full gap-2 bg-green-600 hover:bg-green-700"><Play className="h-4 w-4" />Start Session Now</Button>
          </div>
        )}

        {bids.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-3">Bids ({bids.length})</h3>
            <div className="space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div><p className="font-bold text-xs">{bid.freelancer?.first_name} {bid.freelancer?.last_name}</p><p className="text-[10px] text-muted-foreground">₱{bid.proposed_price}</p></div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${bid.status === "accepted" ? "bg-green-100 text-green-600" : bid.status === "rejected" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>{bid.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{bid.message}</p>
                  {isClient && bid.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleHire(bid.id, bid.freelancer_id, bid.proposed_price)} className="flex-1 text-xs h-8">Hire</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectBid(bid.id, bid.freelancer_id)} className="flex-1 text-xs h-8">Reject</Button>
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