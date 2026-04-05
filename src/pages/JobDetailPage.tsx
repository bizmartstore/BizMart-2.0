import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, MapPin, Star, MessageCircle, Timer, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, User, FileText } from "lucide-react";
import { toast } from "sonner";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [bidForm, setBidForm] = useState({ price: "", message: "" });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [proofFiles, setProofFiles] = useState<string[]>([]);
  const [proofDesc, setProofDesc] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadJob = async () => {
      const { data } = await (supabase as any)
        .from("job_postings")
        .select("*, client:profiles!job_postings_client_id_fkey(*)")
        .eq("id", id)
        .maybeSingle();
      setJob(data);
      
      if (data) {
        // Load bids
        const { data: bidsData } = await (supabase as any)
          .from("job_bids")
          .select("*, freelancer:profiles!job_bids_freelancer_id_fkey(*), freelancer_profile:freelancer_profiles!job_bids_freelancer_id_fkey(*)")
          .eq("job_id", id)
          .order("created_at", { ascending: false });
        setBids(bidsData || []);

        // Load session if exists
        const { data: sessionData } = await (supabase as any)
          .from("job_sessions")
          .select("*")
          .eq("job_id", id)
          .maybeSingle();
        setSession(sessionData);

        // Check if user is approved freelancer
        if (user) {
          const { data: fp } = await (supabase as any)
            .from("freelancer_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          setIsFreelancer(fp?.status === "approved");
        }
      }
      setLoading(false);
    };
    loadJob();
  }, [id, user]);

  // Session timer
  useEffect(() => {
    if (session?.status === "active" && session?.start_time) {
      const startTime = new Date(session.start_time).getTime();
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSessionTimer(elapsed);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    if (!bidForm.message.trim()) {
      toast.error("Please include a message describing your approach");
      return;
    }

    setSubmittingBid(true);
    try {
      const { error } = await (supabase as any).from("job_bids").insert({
        job_id: job.id,
        freelancer_id: user.id,
        proposed_price: price,
        message: bidForm.message.trim(),
        status: "pending",
      });
      if (error) throw error;
      toast.success("Bid submitted! 📝");
      setBidForm({ price: "", message: "" });
      // Reload bids
      const { data: bidsData } = await (supabase as any)
        .from("job_bids")
        .select("*, freelancer:profiles!job_bids_freelancer_id_fkey(*), freelancer_profile:freelancer_profiles!job_bids_freelancer_id_fkey(*)")
        .eq("job_id", id)
        .order("created_at", { ascending: false });
      setBids(bidsData || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit bid");
    }
    setSubmittingBid(false);
  };

  const handleHire = async (bidId: string, freelancerId: string, price: number) => {
    if (!user) return;
    try {
      // Update job
      await (supabase as any).from("job_postings").update({
        status: "in_progress",
        hired_freelancer_id: freelancerId,
        escrow_amount: price,
      }).eq("id", job.id);

      // Reject other bids
      await (supabase as any).from("job_bids").update({ status: "rejected" }).eq("job_id", job.id).neq("id", bidId);

      // Accept selected bid
      await (supabase as any).from("job_bids").update({ status: "accepted" }).eq("id", bidId);

      // Create session
      const { data: sessionData } = await (supabase as any).from("job_sessions").insert({
        job_id: job.id,
        customer_id: user.id,
        freelancer_id: freelancerId,
        status: "scheduled",
      }).select().single();

      setSession(sessionData);
      toast.success("Freelancer hired! Session scheduled. 🤝");
    } catch (err: any) {
      toast.error(err.message || "Failed to hire freelancer");
    }
  };

  const startSession = async () => {
    if (!session) return;
    try {
      await (supabase as any).from("job_sessions").update({
        status: "active",
        start_time: new Date().toISOString(),
      }).eq("id", session.id);
      setSession({ ...session, status: "active", start_time: new Date().toISOString() });
      toast.success("Session started! ⏱️ Timer is running.");
    } catch (err: any) {
      toast.error(err.message || "Failed to start session");
    }
  };

  const endSession = async () => {
    if (!session) return;
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(session.start_time).getTime();
      const durationMinutes = Math.floor((Date.now() - startTime) / 60000);
      
      await (supabase as any).from("job_sessions").update({
        status: "completed",
        end_time: endTime,
        duration_minutes: durationMinutes,
      }).eq("id", session.id);
      setSession({ ...session, status: "completed", end_time: endTime, duration_minutes: durationMinutes });
      toast.success("Session ended. Please upload proof of assistance. 📸");
    } catch (err: any) {
      toast.error(err.message || "Failed to end session");
    }
  };

  const uploadProof = async () => {
    if (!session || !user) return;
    setUploadingProof(true);
    try {
      // In a real app, upload files to storage. For now, we'll simulate with placeholder URLs
      const proofUrls = proofFiles.length > 0 ? proofFiles : ["/placeholder.svg"];
      
      await (supabase as any).from("job_sessions").update({
        proof_urls: proofUrls,
        proof_description: proofDesc,
      }).eq("id", session.id);
      
      setSession({ ...session, proof_urls: proofUrls, proof_description: proofDesc });
      toast.success("Proof uploaded! Customer can now review. ✅");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload proof");
    }
    setUploadingProof(false);
  };

  const approveSession = async () => {
    if (!session) return;
    try {
      // Release escrow
      await (supabase as any).rpc("release_escrow", { session_id: session.id });
      
      await (supabase as any).from("job_sessions").update({
        customer_rating: reviewForm.rating,
        customer_review: reviewForm.review,
      }).eq("id", session.id);
      
      toast.success("Session approved! Payment released to freelancer. 💰");
      navigate("/jobs");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve session");
    }
  };

  const disputeSession = async () => {
    if (!session || !user) return;
    try {
      await (supabase as any).from("job_sessions").update({ status: "disputed" }).eq("id", session.id);
      await (supabase as any).from("job_disputes").insert({
        session_id: session.id,
        reporter_id: user.id,
        reason: reviewForm.review || "Dispute submitted",
        status: "open",
      });
      toast.success("Dispute submitted. Admin will review. ⚖️");
      navigate("/jobs");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit dispute");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Job not found</p>
        <Button onClick={() => navigate("/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  const isExpired = new Date(job.expires_at) < new Date();
  const isClient = job.client_id === user?.id;
  const isHiredFreelancer = session?.freelancer_id === user?.id;
  const hasBid = bids.some(b => b.freelancer_id === user?.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">Job Details</span>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {job.category}
            </span>
            {isExpired && job.status === "open" ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
                EXPIRED
              </span>
            ) : (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                job.status === "in_progress" ? "bg-blue-100 text-blue-600" :
                job.status === "completed" ? "bg-green-100 text-green-600" :
                "bg-green-100 text-green-600"
              }`}>
                {job.status.toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold leading-tight mb-2">{job.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>₱{job.hourly_rate}/hr</span>
            </div>
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4" />
              <span>Expires: {new Date(job.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-bold text-sm mb-2">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        {/* Client Info */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-bold text-sm mb-3">Client</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold">
                {job.client?.first_name?.[0]}{job.client?.last_name?.[0]}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">
                {job.client?.first_name} {job.client?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{job.client?.email}</p>
            </div>
          </div>
        </div>

        {/* Session Management */}
        {session && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" /> Session Status
            </h2>
            
            {session.status === "scheduled" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Session is scheduled. Meet at the agreed location.</p>
                {isClient && (
                  <Button onClick={startSession} className="w-full h-11 font-bold rounded-xl">
                    <Timer className="h-4 w-4 mr-2" /> Start Session
                  </Button>
                )}
              </div>
            )}

            {session.status === "active" && (
              <div className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Session Duration</p>
                  <p className="text-2xl font-extrabold text-primary font-mono">{formatTime(sessionTimer)}</p>
                </div>
                {isClient && (
                  <Button onClick={endSession} variant="destructive" className="w-full h-11 font-bold rounded-xl">
                    End Session
                  </Button>
                )}
              </div>
            )}

            {session.status === "completed" && !session.escrow_released && (
              <div className="space-y-3">
                {isHiredFreelancer && !session.proof_urls?.length && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Upload Proof of Assistance</Label>
                    <Textarea 
                      placeholder="Describe the work completed..." 
                      value={proofDesc}
                      onChange={(e) => setProofDesc(e.target.value)}
                      className="text-xs"
                      rows={2}
                    />
                    <Button onClick={uploadProof} disabled={uploadingProof} className="w-full h-10 text-xs">
                      {uploadingProof ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                      Upload Proof
                    </Button>
                  </div>
                )}
                
                {isClient && session.proof_urls?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Review Proof & Approve</Label>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-2">{session.proof_description || "No description provided"}</p>
                      <div className="flex gap-2">
                        {session.proof_urls.map((url: string, i: number) => (
                          <img key={i} src={url} alt="Proof" className="w-16 h-16 rounded object-cover" />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setReviewForm({...reviewForm, rating: star})} className="p-1">
                          <Star className={`h-5 w-5 ${star <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea 
                      placeholder="Leave feedback (optional)..." 
                      value={reviewForm.review}
                      onChange={(e) => setReviewForm({...reviewForm, review: e.target.value})}
                      className="text-xs"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button onClick={approveSession} className="flex-1 h-10 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approve & Release Payment
                      </Button>
                      <Button onClick={disputeSession} variant="destructive" className="flex-1 h-10 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Dispute
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {session.escrow_released && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-green-700">Payment Released Successfully</p>
                <p className="text-[10px] text-green-600">80% to freelancer, 10% maintenance, 10% admin</p>
              </div>
            )}
          </div>
        )}

        {/* Bids Section (Client View) */}
        {isClient && job.status === "open" && bids.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" /> Freelancer Bids ({bids.length})
            </h2>
            {bids.filter(b => b.status === "pending").map(bid => (
              <div key={bid.id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{bid.freelancer?.first_name} {bid.freelancer?.last_name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] text-muted-foreground">
                          {bid.freelancer_profile?.rating?.toFixed(1) || "New"} · {bid.freelancer_profile?.completed_sessions || 0} sessions
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-primary">₱{bid.proposed_price}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{bid.message}</p>
                <Button size="sm" onClick={() => handleHire(bid.id, bid.freelancer_id, bid.proposed_price)} className="w-full h-9 text-xs">
                  Hire This Freelancer
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Bid Form (Freelancer View) */}
        {isFreelancer && job.status === "open" && !hasBid && !isClient && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <h2 className="font-bold text-sm">Submit a Bid</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Your Price (₱{job.min_price}-₱{job.max_price})</Label>
                <Input 
                  type="number" 
                  value={bidForm.price}
                  onChange={(e) => setBidForm({...bidForm, price: e.target.value})}
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px]">Message & Qualifications</Label>
              <Textarea 
                placeholder="Describe your approach and why you're qualified..." 
                value={bidForm.message}
                onChange={(e) => setBidForm({...bidForm, message: e.target.value})}
                className="text-xs"
                rows={3}
              />
            </div>
            <Button onClick={handleBid} disabled={submittingBid} className="w-full h-10 text-xs">
              {submittingBid ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
              Submit Bid
            </Button>
          </div>
        )}

        {hasBid && job.status === "open" && (
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground">You've already submitted a bid. Waiting for client response...</p>
          </div>
        )}

        {/* Policy Reminder */}
        <div className="mt-8 p-4 bg-muted/30 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <span className="font-bold text-xs">Academic Integrity Policy</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Freelancers are here to **guide and tutor** you. They are strictly prohibited from completing assignments, projects, or graded work on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}