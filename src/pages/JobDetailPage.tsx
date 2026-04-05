import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, MapPin, Star, MessageCircle, Timer, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, User, FileText, Users, Wallet, Phone, RefreshCw, ListChecks, Target, File, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { notifyCustomerNewBid, notifyFreelancerHired, notifyFreelancerRejected } from "@/lib/notifications";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [bidForm, setBidForm] = useState({ price: "", message: "", contactNumber: "" });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [proofFiles, setProofFiles] = useState<string[]>([]);
  const [proofDesc, setProofDesc] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: "", needsRevision: false });
  const [submittingReview, setSubmittingReview] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadBids = useCallback(async () => {
    if (!id) return;
    const { data: bidsData, error } = await (supabase as any).from("job_bids").select("*").eq("job_id", id).order("created_at", { ascending: false });
    if (error) { console.error("Failed to load bids:", error); return; }
    if (!bidsData || bidsData.length === 0) { setBids([]); return; }

    const freelancerIds = bidsData.map((b: any) => b.freelancer_id).filter(Boolean);
    let profilesMap: Record<string, any> = {};
    let freelancerProfilesMap: Record<string, any> = {};

    if (freelancerIds.length > 0) {
      const { data: profs } = await (supabase as any).from("profiles").select("user_id, first_name, last_name, email, avatar_url").in("user_id", freelancerIds);
      const { data: fProfs } = await (supabase as any).from("freelancer_profiles").select("user_id, rating, completed_sessions, academic_strengths, subjects").in("user_id", freelancerIds);
      (profs || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
      (fProfs || []).forEach((fp: any) => { freelancerProfilesMap[fp.user_id] = fp; });
    }

    setBids(bidsData.map((bid: any) => ({ ...bid, freelancer: profilesMap[bid.freelancer_id] || null, freelancer_profile: freelancerProfilesMap[bid.freelancer_id] || null })));
  }, [id]);

  useEffect(() => {
    const loadJob = async () => {
      const { data } = await (supabase as any).from("job_postings").select("*, client:profiles!job_postings_client_id_fkey(*)").eq("id", id).maybeSingle();
      setJob(data);
      if (data) {
        await loadBids();
        const { data: sessionData } = await (supabase as any).from("job_sessions").select("*").eq("job_id", id).maybeSingle();
        setSession(sessionData);
        if (user) {
          const { data: fp } = await (supabase as any).from("freelancer_profiles").select("*").eq("user_id", user.id).maybeSingle();
          setIsFreelancer(fp?.status === "approved");
        }
      }
      setLoading(false);
    };
    loadJob();
  }, [id, user, loadBids]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase.channel(`job-bids-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "job_bids", filter: `job_id=eq.${id}` }, () => loadBids())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "job_bids", filter: `job_id=eq.${id}` }, () => loadBids())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, loadBids]);

  useEffect(() => {
    if (session?.status === "active" && session?.start_time) {
      const startTime = new Date(session.start_time).getTime();
      const updateTimer = () => setSessionTimer(Math.floor((Date.now() - startTime) / 1000));
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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
    if (price < job.min_price || price > job.max_price) { toast.error(`Bid must be between ₱${job.min_price} and ₱${job.max_price}`); return; }
    if (!bidForm.message.trim()) { toast.error("Please include a message describing your approach"); return; }
    if (!bidForm.contactNumber.trim()) { toast.error("Please provide your contact number"); return; }

    setSubmittingBid(true);
    try {
      const { error } = await (supabase as any).from("job_bids").insert({
        job_id: job.id, freelancer_id: user.id, proposed_price: price, message: bidForm.message.trim(),
        contact_number: bidForm.contactNumber.trim(), status: "pending",
      });
      if (error) throw error;
      if (job.client_id) {
        const freelancerName = profile ? `${profile.first_name} ${profile.last_name}` : "A freelancer";
        await notifyCustomerNewBid(job.client_id, freelancerName, job.title, price);
      }
      toast.success("Bid submitted successfully! 📝");
      setBidForm({ price: "", message: "", contactNumber: "" });
      await loadBids();
    } catch (err: any) { toast.error(err.message || "Failed to submit bid"); }
    setSubmittingBid(false);
  };

  const handleHire = async (bidId: string, freelancerId: string, price: number) => {
    if (!user) return;
    try {
      await (supabase as any).from("job_postings").update({ status: "in_progress", hired_freelancer_id: freelancerId, escrow_amount: price }).eq("id", job.id);
      const otherBids = bids.filter(b => b.id !== bidId && b.status === "pending");
      for (const otherBid of otherBids) {
        await (supabase as any).from("job_bids").update({ status: "rejected" }).eq("id", otherBid.id);
        if (otherBid.freelancer_id) await notifyFreelancerRejected(otherBid.freelancer_id, job.title);
      }
      await (supabase as any).from("job_bids").update({ status: "accepted" }).eq("id", bidId);
      const hiredBid = bids.find(b => b.id === bidId);
      if (hiredBid?.freelancer?.first_name) await notifyFreelancerHired(freelancerId, job.title, `${profile?.first_name || 'Customer'}`);
      const { data: sessionData } = await (supabase as any).from("job_sessions").insert({ job_id: job.id, customer_id: user.id, freelancer_id: freelancerId, status: "scheduled" }).select().single();
      setSession(sessionData);
      toast.success("Freelancer hired! Session scheduled. 🤝");
    } catch (err: any) { toast.error(err.message || "Failed to hire freelancer"); }
  };

  const startSession = async () => {
    if (!session) return;
    try {
      await (supabase as any).from("job_sessions").update({ status: "active", start_time: new Date().toISOString() }).eq("id", session.id);
      setSession({ ...session, status: "active", start_time: new Date().toISOString() });
      toast.success("Session started! ⏱️ Timer is running.");
    } catch (err: any) { toast.error(err.message || "Failed to start session"); }
  };

  const endSession = async () => {
    if (!session) return;
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(session.start_time).getTime();
      const durationMinutes = Math.floor((Date.now() - startTime) / 60000);
      await (supabase as any).from("job_sessions").update({ status: "completed", end_time: endTime, duration_minutes: durationMinutes }).eq("id", session.id);
      setSession({ ...session, status: "completed", end_time: endTime, duration_minutes: durationMinutes });
      toast.success("Session ended. Please upload proof of assistance. 📸");
    } catch (err: any) { toast.error(err.message || "Failed to end session"); }
  };

  const uploadProof = async () => {
    if (!session || !user) return;
    setUploadingProof(true);
    try {
      const proofUrls = proofFiles.length > 0 ? proofFiles : ["/placeholder.svg"];
      await (supabase as any).from("job_sessions").update({ proof_urls: proofUrls, proof_description: proofDesc }).eq("id", session.id);
      setSession({ ...session, proof_urls: proofUrls, proof_description: proofDesc });
      toast.success("Proof uploaded! Customer can now review. ✅");
    } catch (err: any) { toast.error(err.message || "Failed to upload proof"); }
    setUploadingProof(false);
  };

  const submitReview = async () => {
    if (!session) return;
    setSubmittingReview(true);
    try {
      if (reviewForm.needsRevision) {
        await (supabase as any).from("job_sessions").update({ status: "revision_requested", revision_notes: reviewForm.review }).eq("id", session.id);
        setSession({ ...session, status: "revision_requested", revision_notes: reviewForm.review });
        toast.info("Revision requested. Freelancer will update their work.");
      } else {
        await (supabase as any).rpc("release_escrow", { session_id: session.id });
        await (supabase as any).from("job_sessions").update({ customer_rating: reviewForm.rating, customer_review: reviewForm.review }).eq("id", session.id);
        await (supabase as any).from("job_postings").update({ status: "completed" }).eq("id", job.id);
        toast.success("Work approved! Payment released to freelancer. 💰");
        navigate("/jobs");
      }
    } catch (err: any) { toast.error(err.message || "Failed to submit review"); }
    setSubmittingReview(false);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!job) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"><p className="text-muted-foreground mb-4">Job not found</p><Button onClick={() => navigate("/jobs")}>Back to Jobs</Button></div>;

  const isExpired = new Date(job.expires_at) < new Date();
  const isClient = job.client_id === user?.id;
  const isHiredFreelancer = session?.freelancer_id === user?.id;
  const hasBid = bids.some(b => b.freelancer_id === user?.id);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5"><ArrowLeft className="h-5 w-5" /></button>
        <span className="font-bold text-sm ml-2">Job Details</span>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">{job.category}</span>
            {isExpired && job.status === "open" ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">EXPIRED</span> : (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                job.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                job.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                job.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                job.status === 'ready_to_start' ? 'bg-green-100 text-green-700' :
                job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-muted text-muted-foreground'
              }`}>{job.status.replace('_', ' ').toUpperCase()}</span>
            )}
          </div>
          <h1 className="text-xl font-bold leading-tight mb-2">{job.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{job.location}</span></div>
            <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>₱{job.hourly_rate}/hr</span></div>
            <div className="flex items-center gap-1"><Timer className="h-4 w-4" /><span>Expires: {new Date(job.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
          </div>
        </div>

        {/* Escrow Payment Notice (Client View) */}
        {isClient && job.status === "pending_payment" && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300">Secure Your Escrow Payment</h3>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Before your job can be approved, you must first hand over the payment to the BizMart staff. This payment will be securely held by the admin as an escrow to ensure a safe and fair transaction. The job will remain pending and will not proceed to approval until the payment is confirmed. If the job offer is cancelled or fails to proceed, the BizMart staff will return the full payment to the client. This system is designed to prevent scams from both clients and freelancers by ensuring that funds are secured before any work begins and are only released once the job is successfully completed and approved by both parties.
            </p>
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Amount to Secure:</span>
              <span className="text-lg font-extrabold text-amber-600">₱{job.hourly_rate}</span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-bold text-sm mb-2">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Instructions & Requirements */}
        {(job.instructions || job.expected_output || job.requirements) && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-4">
            {job.instructions && (
              <div>
                <h2 className="font-bold text-sm mb-2 flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Step-by-Step Instructions</h2>
                <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.instructions}</div>
              </div>
            )}
            {job.expected_output && (
              <div>
                <h2 className="font-bold text-sm mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Expected Output</h2>
                <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.expected_output}</div>
              </div>
            )}
            {job.requirements && (
              <div>
                <h2 className="font-bold text-sm mb-2 flex items-center gap-2"><File className="h-4 w-4 text-primary" /> Specific Requirements</h2>
                <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.requirements}</div>
              </div>
            )}
          </div>
        )}

        {/* Client Info */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <h2 className="font-bold text-sm mb-3">Client</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-sm font-bold">{job.client?.first_name?.[0]}{job.client?.last_name?.[0]}</span></div>
            <div><p className="font-semibold text-sm">{job.client?.first_name} {job.client?.last_name}</p><p className="text-xs text-muted-foreground">{job.client?.email}</p></div>
          </div>
        </div>

        {/* Bids Section (Client View) */}
        {isClient && (job.status === "ready_to_start" || job.status === "open" || job.status === "approved") && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Freelancer Bids ({bids.length})</h2>
              {bids.length === 0 && <span className="text-[10px] text-muted-foreground">Waiting for bids...</span>}
            </div>
            {bids.length > 0 ? (
              <div className="space-y-3">
                {bids.filter(b => b.status === "pending").map(bid => (
                  <div key={bid.id} className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div>
                        <div>
                          <p className="text-xs font-bold">{bid.freelancer?.first_name} {bid.freelancer?.last_name}</p>
                          <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">{bid.contact_number || "No contact"}</span></div>
                          <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /><span className="text-[10px] text-muted-foreground">{bid.freelancer_profile?.rating?.toFixed(1) || "New"} · {bid.freelancer_profile?.completed_sessions || 0} sessions</span></div>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-primary">₱{bid.proposed_price}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground bg-background/50 p-2 rounded-md">{bid.message}</p>
                    <Button size="sm" onClick={() => handleHire(bid.id, bid.freelancer_id, bid.proposed_price)} className="w-full h-9 text-xs">Hire This Freelancer</Button>
                  </div>
                ))}
                {bids.filter(b => b.status !== "pending").length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-[10px] text-muted-foreground mb-2">Other bids ({bids.filter(b => b.status !== "pending").length})</p>
                    {bids.filter(b => b.status !== "pending").map(bid => (
                      <div key={bid.id} className="bg-muted/20 rounded-lg p-2 mb-1.5 opacity-70">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">{bid.freelancer?.first_name} {bid.freelancer?.last_name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${bid.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{bid.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/20 rounded-lg"><Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground">No bids yet. Freelancers will appear here when they apply.</p></div>
            )}
          </div>
        )}

        {/* Session Management */}
        {session && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <h2 className="font-bold text-sm flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Session Status</h2>
            
            {session.status === "scheduled" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Session is scheduled. Meet at the agreed location.</p>
                {isClient && <Button onClick={startSession} className="w-full h-11 font-bold rounded-xl"><Timer className="h-4 w-4 mr-2" /> Start Session</Button>}
              </div>
            )}

            {session.status === "active" && (
              <div className="space-y-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Session Duration</p>
                  <p className="text-2xl font-extrabold text-primary font-mono">{formatTime(sessionTimer)}</p>
                </div>
                {isClient && <Button onClick={endSession} variant="destructive" className="w-full h-11 font-bold rounded-xl">End Session</Button>}
              </div>
            )}

            {session.status === "completed" && !session.escrow_released && (
              <div className="space-y-3">
                {isHiredFreelancer && !session.proof_urls?.length && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Upload Proof of Assistance</Label>
                    <Textarea placeholder="Describe how you followed the instructions and completed the task..." value={proofDesc} onChange={(e) => setProofDesc(e.target.value)} className="text-xs" rows={3} />
                    <Button onClick={uploadProof} disabled={uploadingProof} className="w-full h-10 text-xs">{uploadingProof ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />} Upload Proof</Button>
                  </div>
                )}
                
                {isClient && session.proof_urls?.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">Review Proof & Approve</Label>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-2 whitespace-pre-wrap">{session.proof_description || "No description provided"}</p>
                      <div className="flex gap-2 flex-wrap">
                        {session.proof_urls.map((url: string, i: number) => (<img key={i} src={url} alt="Proof" className="w-16 h-16 rounded object-cover border border-border" />))}
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setReviewForm({...reviewForm, rating: star})} className="p-1"><Star className={`h-5 w-5 ${star <= reviewForm.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} /></button>))}
                    </div>
                    <Textarea placeholder="Leave feedback or request revisions..." value={reviewForm.review} onChange={(e) => setReviewForm({...reviewForm, review: e.target.value})} className="text-xs" rows={2} />
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" id="needsRevision" checked={reviewForm.needsRevision} onChange={(e) => setReviewForm({...reviewForm, needsRevision: e.target.checked})} className="rounded" />
                      <Label htmlFor="needsRevision" className="text-xs">Request revisions instead of approving</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={submitReview} disabled={submittingReview} className="flex-1 h-10 text-xs">{submittingReview ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />} {reviewForm.needsRevision ? "Request Revision" : "Approve & Release Payment"}</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {session.status === "revision_requested" && isHiredFreelancer && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs font-bold text-amber-700 mb-1">Revision Requested</p>
                <p className="text-xs text-amber-600 whitespace-pre-wrap">{session.revision_notes || "Please update your work based on client feedback."}</p>
                <Button onClick={() => setSession({...session, status: "active"})} className="w-full mt-2 h-9 text-xs">Resubmit Work</Button>
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

        {/* Bid Form (Freelancer View) */}
        {isFreelancer && (job.status === "approved" || job.status === "ready_to_start" || job.status === "open") && !hasBid && !isClient && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-3">
            <h2 className="font-bold text-sm">Submit a Bid</h2>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Your Price (₱{job.min_price}-₱{job.max_price})</Label><Input type="number" value={bidForm.price} onChange={(e) => setBidForm({...bidForm, price: e.target.value})} className="text-xs h-8" /></div>
              <div><Label className="text-[10px]">Contact Number *</Label><Input type="tel" placeholder="09XXXXXXXXX" value={bidForm.contactNumber} onChange={(e) => setBidForm({...bidForm, contactNumber: e.target.value.replace(/\D/g, "").slice(0, 11)})} className="text-xs h-8" /></div>
            </div>
            <div><Label className="text-[10px]">Message & Qualifications</Label><Textarea placeholder="Describe your approach and why you're qualified..." value={bidForm.message} onChange={(e) => setBidForm({...bidForm, message: e.target.value})} className="text-xs" rows={3} /></div>
            <Button onClick={handleBid} disabled={submittingBid} className="w-full h-10 text-xs">{submittingBid ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null} Submit Bid</Button>
          </div>
        )}

        {hasBid && (job.status === "approved" || job.status === "ready_to_start" || job.status === "open") && (
          <div className="bg-muted/30 rounded-xl p-4 text-center border border-border">
            <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">You've already submitted a bid!</p>
            <p className="text-xs text-muted-foreground mt-1">Waiting for the client to review your proposal...</p>
          </div>
        )}

        {/* Policy Reminder */}
        <div className="mt-8 p-4 bg-muted/30 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-primary" /><span className="font-bold text-xs">Academic Integrity Policy</span></div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">Freelancers are here to **guide and tutor** you. They are strictly prohibited from completing assignments, projects, or graded work on your behalf.</p>
        </div>
      </div>
    </div>
  );
}