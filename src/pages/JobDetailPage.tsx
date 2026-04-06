import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, MapPin, Star, CheckCircle2, XCircle, Loader2, FileText, User, Timer, Calendar, Wallet, Play, Square, Upload, Target } from "lucide-react";
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

  // Load job, bids, and session data
  const loadJobData = async () => {
    if (!id || !user) return;
    
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
      
      if (bidsError) throw bidsError;
      setBids(bidsData || []);

      // Load session
      const { data: sessionData, error: sessionError } = await (supabase as any)
        .from("job_sessions")
        .select("*")
        .eq("job_id", id)
        .maybeSingle();
      
      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Check if user has bid
      const myBid = bidsData?.find((b: any) => b.freelancer_id === user.id);
      setMyBidStatus(myBid ? myBid.status : null);
    } catch (err: any) {
      console.error("Failed to load job data:", err);
      toast.error(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or job ID changes
  useEffect(() => {
    loadJobData();
  }, [id, user]);

  // Real-time updates for job postings
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`job-detail-${id}`)
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "job_postings",
        filter: `id=eq.${id}`
      }, (payload: any) => {
        setJob(payload.new);
      })
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "job_bids",
        filter: `job_id=eq.${id}`
      }, () => {
        loadJobData();
      })
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "job_sessions",
        filter: `job_id=eq.${id}`
      }, (payload: any) => {
        setSession(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session?.status, session?.start_time]);

  // Computed state: is session fully reviewed
  const isFullyReviewed = useMemo(() => {
    return !!session?.freelancer_proof_submitted_at && !!session?.customer_proof_submitted_at;
  }, [session]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Submit a new bid
  const handleBid = async () => {
    if (!user || !job) return;
    
    const price = Number(bidForm.price);
    if (price < job.min_price || price > job.max_price) {
      toast.error(`Bid must be between ₱${job.min_price} and ₱${job.max_price}`);
      return;
    }
    
    if (!bidForm.message.trim()) {
      toast.error("Please include a message describing your approach");
      return;
    }
    
    if (!bidForm.contactNumber.trim()) {
      toast.error("Please provide your contact number");
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
      
      // Notify client about new bid
      await sendNotification({
        title: "📝 New Bid Received",
        message: `A freelancer placed a bid of ₱${price} on your job "${job.title}".`,
        type: "new_bid",
        userId: job.client_id,
        link: `/jobs/${job.id}`,
        icon: "📝",
      });
    } catch (err: any) {
      console.error("Bid submission error:", err);
      toast.error(err.message || "Failed to submit bid");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Handle hiring a freelancer
  const handleHire = async (bidId: string, freelancerId: string, price: number) => {
    if (!user) return;
    
    try {
      // Update job status and hired freelancer
      await (supabase as any).from("job_postings").update({
        status: "ready_to_start",
        hired_freelancer_id: freelancerId,
      }).eq("id", job.id);
      
      // Update bid status
      await (supabase as any).from("job_bids").update({
        status: "accepted"
      }).eq("id", bidId);
      
      // Create session
      await (supabase as any).from("job_sessions").insert({
        job_id: job.id,
        freelancer_id: freelancerId,
        status: "scheduled",
        escrow_amount: price,
      });
      
      // Notify freelancer
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
      console.error("Hire error:", err);
      toast.error(err.message || "Failed to hire freelancer");
    }
  };

  // Reject a bid
  const handleRejectBid = async (bidId: string, freelancerId: string) => {
    try {
      await (supabase as any).from("job_bids").update({
        status: "rejected"
      }).eq("id", bidId);
      
      // Notify freelancer
      await sendNotification({
        title: "💪 Keep Up the Great Work!",
        message: `The client chose another freelancer for "${job?.title}" this time. Don't worry, more opportunities are coming your way!`,
        type: "freelancer_rejected",
        userId: freelancerId,
        link: "/jobs",
        icon: "💪",
      });
      
      toast.success("Bid rejected");
      loadJobData();
    } catch (err: any) {
      console.error("Reject bid error:", err);
      toast.error(err.message || "Failed to reject bid");
    }
  };

  // Start a session
  const startSession = async () => {
    if (!session) return;
    
    try {
      await (supabase as any).from("job_sessions").update({
        status: "active",
        start_time: new Date().toISOString(),
      }).eq("id", session.id);
      
      toast.success("Session started! ⏱️ Timer is running.");
      loadJobData();
    } catch (err: any) {
      console.error("Start session error:", err);
      toast.error(err.message || "Failed to start session");
    }
  };

  // End a session
  const endSession = async () => {
    if (!session) return;
    
    try {
      const endTime = new Date().toISOString();
      await (supabase as any).from("job_sessions").update({
        status: "pending_review",
        end_time: endTime,
      }).eq("id", session.id);
      
      toast.success("Session ended! Please submit proof of completion.");
      loadJobData();
      
      // Notify both parties to submit proof
      await sendNotification({
        title: "🔍 Session Completed - Submit Proof",
        message: `The session for "${job?.title}" has ended. Please submit proof of completion.`,
        type: "session_completed",
        userId: job?.client_id,
        link: `/jobs/${job?.id}`,
        icon: "🔍",
      });
      
      await sendNotification({
        title: "🔍 Session Completed - Submit Proof",
        message: `The session for "${job?.title}" has ended. Please submit proof of completion.`,
        type: "session_completed",
        userId: session?.freelancer_id,
        link: `/jobs/${job?.id}`,
        icon: "🔍",
      });
    } catch (err: any) {
      console.error("End session error:", err);
      toast.error(err.message || "Failed to end session");
    }
  };

  // Submit proof (freelancer or customer)
  const submitProof = async (role: "freelancer" | "customer") => {
    if (!session) return;
    
    const proofText = role === "freelancer" ? freelancerProof : customerProof;
    if (!proofText.trim()) {
      toast.error("Please describe the work completed");
      return;
    }
    
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
      
      // Check if both proofs are submitted
      const updatedSession = { ...session, ...updateData };
      const bothSubmitted = updatedSession.freelancer_proof_submitted_at && updatedSession.customer_proof_submitted_at;
      
      if (bothSubmitted) {
        // Notify admin for review
        await sendNotification({
          title: "🔍 Job Completion Awaiting Review",
          message: `Both parties submitted proof for job "${job?.title}". Awaiting admin review.`,
          type: "completion_review",
          targetRole: "admin",
          link: `/admin?tab=jobs`,
          icon: "🔍",
        });
      }
      
      loadJobData();
    } catch (err: any) {
      console.error("Proof submission error:", err);
      toast.error(err.message || "Failed to submit proof");
    } finally {
      setUploadingProof(false);
      if (role === "freelancer") setFreelancerProof("");
      else setCustomerProof("");
    }
  };

  // Render proof content
  const renderProofContent = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("http") && (line.includes(".jpg") || line.includes(".png") || line.includes(".jpeg") || line.includes(".webp"))) {
        return <img key={i} src={line} alt="Proof" className="w-full max-h-48 object-contain rounded-lg border border-border mt-2" />;
      }
      return <p key={i} className="text-xs text-foreground whitespace-pre-wrap">{line}</p>;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-xl mb-2">Job Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/jobs")} className="w-full max-w-xs h-12 font-bold rounded-xl">Back to Jobs</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const isClient = user?.id === job.client_id;
  const isHiredFreelancer = user?.id === job.hired_freelancer_id;
  const canBid = !isClient && job.status === "open" && !myBidStatus;
  const canStartSession = isHiredFreelancer && session?.status === "scheduled";
  const canEndSession = isHiredFreelancer && session?.status === "active";
  const showProofSubmission = (isHiredFreelancer || isClient) && session?.status === "pending_review" && !isFullyReviewed;
  const showSessionDetails = session && (session.status === "active" || session.status === "pending_review" || (session.status === "completed" && !isFullyReviewed));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold">Job Details</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Job Header */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="font-bold text-base">{job.title}</h2>
              <p className="text-xs text-muted-foreground">
                Posted by {job.client?.first_name} {job.client?.last_name}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              job.status === "open" ? "bg-green-100 text-green-600" :
              job.status === "pending_payment" ? "bg-amber-100 text-amber-600" :
              job.status === "pending_approval" ? "bg-yellow-100 text-yellow-600" :
              job.status === "approved" ? "bg-blue-100 text-blue-600" :
              job.status === "ready_to_start" ? "bg-purple-100 text-purple-600" :
              job.status === "in_progress" ? "bg-indigo-100 text-indigo-600" :
              job.status === "pending_review" ? "bg-orange-100 text-orange-600" :
              job.status === "completed" ? "bg-emerald-100 text-emerald-600" :
              "bg-muted text-muted-foreground"
            }`}>
              {job.status.replace("_", " ").toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <p className="text-lg font-extrabold text-primary">₱{job.hourly_rate}</p>
              <p className="text-[9px] text-muted-foreground">Budget</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <p className="text-lg font-extrabold text-secondary">{job.category}</p>
              <p className="text-[9px] text-muted-foreground">Category</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span>{job.location}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Needed: {new Date(job.expires_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="font-bold text-sm mb-2">Description</h3>
          <p className="text-xs text-muted-foreground">{job.description}</p>
        </div>

        {/* Instructions */}
        {job.instructions && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> Instructions
            </h3>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{job.instructions}</p>
          </div>
        )}

        {/* Expected Output */}
        {job.expected_output && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" /> Expected Output
            </h3>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{job.expected_output}</p>
          </div>
        )}

        {/* Requirements */}
        {job.requirements && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> Requirements
            </h3>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
          </div>
        )}

        {/* Session Controls */}
        {showSessionDetails && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" /> Session Details
            </h3>
            
            {session.status === "active" && (
              <div className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-xs font-bold text-primary uppercase">Session Active</p>
                  <p className="text-2xl font-extrabold text-primary mt-1">{formatTime(sessionTimer)}</p>
                </div>
                
                <Button onClick={endSession} className="w-full gap-2">
                  <Square className="h-4 w-4" />
                  End Session
                </Button>
              </div>
            )}
            
            {session.status === "pending_review" && !isFullyReviewed && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-muted-foreground">Started</p>
                    <p className="text-xs font-bold">
                      {session.start_time ? new Date(session.start_time).toLocaleTimeString() : "N/A"}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-muted-foreground">Ended</p>
                    <p className="text-xs font-bold">
                      {session.end_time ? new Date(session.end_time).toLocaleTimeString() : "N/A"}
                    </p>
                  </div>
                </div>
                
                {/* Freelancer Proof Submission */}
                {isHiredFreelancer && !session.freelancer_proof_submitted_at && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <Label className="text-xs font-bold mb-2 block">Submit Work Proof</Label>
                    <Textarea
                      value={freelancerProof}
                      onChange={(e) => setFreelancerProof(e.target.value)}
                      placeholder="Describe the work completed or paste image links..."
                      className="text-xs mb-2"
                      rows={3}
                    />
                    <Button 
                      onClick={() => submitProof("freelancer")} 
                      disabled={uploadingProof || !freelancerProof.trim()}
                      className="w-full text-xs"
                    >
                      {uploadingProof ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                      Submit Proof
                    </Button>
                  </div>
                )}
                
                {/* Customer Proof Submission */}
                {isClient && !session.customer_proof_submitted_at && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <Label className="text-xs font-bold mb-2 block">Confirm Completion</Label>
                    <Textarea
                      value={customerProof}
                      onChange={(e) => setCustomerProof(e.target.value)}
                      placeholder="Confirm the work was completed satisfactorily..."
                      className="text-xs mb-2"
                      rows={3}
                    />
                    <Button 
                      onClick={() => submitProof("customer")} 
                      disabled={uploadingProof || !customerProof.trim()}
                      className="w-full text-xs"
                    >
                      {uploadingProof ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                      Confirm Completion
                    </Button>
                  </div>
                )}
                
                {/* Proof Display */}
                {session.freelancer_proof_submitted_at && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-bold text-muted-foreground mb-1">Freelancer's Proof</p>
                    {renderProofContent(session.freelancer_proof)}
                    <p className="text-[9px] text-muted-foreground mt-1">
                      Submitted: {new Date(session.freelancer_proof_submitted_at).toLocaleString()}
                    </p>
                  </div>
                )}
                
                {session.customer_proof_submitted_at && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-bold text-muted-foreground mb-1">Customer's Confirmation</p>
                    {renderProofContent(session.customer_proof)}
                    <p className="text-[9px] text-muted-foreground mt-1">
                      Submitted: {new Date(session.customer_proof_submitted_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {isFullyReviewed && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-700">Session completed and reviewed</p>
                <p className="text-[10px] text-emerald-600 mt-1">Awaiting admin approval</p>
              </div>
            )}
          </div>
        )}

        {/* Bid Form (for freelancers) */}
        {canBid && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-3">Submit Your Bid</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Proposed Price (₱{job.min_price} - ₱{job.max_price})</Label>
                <Input
                  type="number"
                  value={bidForm.price}
                  onChange={(e) => setBidForm({...bidForm, price: e.target.value})}
                  placeholder={`₱${job.min_price} - ₱${job.max_price}`}
                  className="text-xs h-9 mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs">Contact Number</Label>
                <Input
                  value={bidForm.contactNumber}
                  onChange={(e) => setBidForm({...bidForm, contactNumber: e.target.value})}
                  placeholder="09XXXXXXXXX"
                  className="text-xs h-9 mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs">Your Approach</Label>
                <Textarea
                  value={bidForm.message}
                  onChange={(e) => setBidForm({...bidForm, message: e.target.value})}
                  placeholder="Describe how you'll complete this job..."
                  className="text-xs mt-1"
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleBid} 
                disabled={submittingBid}
                className="w-full h-10 text-xs font-bold"
              >
                {submittingBid ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Bid
              </Button>
            </div>
          </div>
        )}

        {/* Start Session Button */}
        {canStartSession && (
          <Button onClick={startSession} className="w-full gap-2">
            <Play className="h-4 w-4" />
            Start Session
          </Button>
        )}

        {/* Bids List (for clients) */}
        {isClient && bids.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-bold text-sm mb-3">Bids ({bids.length})</h3>
            <div className="space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-xs">
                        {bid.freelancer?.first_name} {bid.freelancer?.last_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">₱{bid.proposed_price}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      bid.status === "accepted" ? "bg-green-100 text-green-600" :
                      bid.status === "rejected" ? "bg-red-100 text-red-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      {bid.status}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">{bid.message}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">📞 {bid.contact_number}</p>
                  
                  {bid.status === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleHire(bid.id, bid.freelancer_id, bid.proposed_price)}
                        className="flex-1 text-xs h-8"
                      >
                        Hire
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleRejectBid(bid.id, bid.freelancer_id)}
                        className="flex-1 text-xs h-8"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}