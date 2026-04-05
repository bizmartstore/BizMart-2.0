import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, MapPin, Star, MessageCircle, Timer, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, User, FileText, Users, Wallet, Phone, RefreshCw, ListChecks, Target, File, ShieldCheck, Image as ImageIcon, Ban } from "lucide-react";
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
  const [freelancerProof, setFreelancerProof] = useState("");
  const [customerProof, setCustomerProof] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [myBidStatus, setMyBidStatus] = useState<string | null>(null);
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
    
    if (user) {
      const myBid = bidsData.find((b: any) => b.freelancer_id === user.id);
      setMyBidStatus(myBid?.status || null);
    }
  }, [id, user]);

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
      .on("postgres_changes", { event: "*", schema: "public", table: "job_sessions", filter: `job_id=eq.${id}` }, async () => {
        const { data: sessionData } = await (supabase as any).from("job_sessions").select("*").eq("job_id", id).maybeSingle();
        setSession(sessionData);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "job_postings", filter: `id=eq.${id}` }, async () => {
        const { data } = await (supabase as any).from("job_postings").select("*, client:profiles!job_postings_client_id_fkey(*)").eq("id", id).maybeSingle();
        setJob(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, loadBids]);

  // FIXED: Robust timer logic that prevents negative values, handles clock skew, and stops correctly
  useEffect(() => {
    if (!session) return;
    
    // Always clear existing interval first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (session.status === "active" && session.start_time) {
      const startTime = new Date(session.start_time).getTime();
      const updateTimer = () => {
        // Math.max(0, ...) prevents negative values from client/server clock skew
        const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setSessionTimer(diff);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else if (session.duration_minutes !== null && session.duration_minutes !== undefined) {
      // Use stored duration from DB if session has ended
      setSessionTimer(session.duration_minutes * 60);
    } else if (session.end_time && session.start_time) {
      // Fallback: calculate from timestamps
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time).getTime();
      setSessionTimer(Math.max(0, Math.floor((end - start) / 1000)));
    } else {
      setSessionTimer(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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
      setJob(prev => prev ? { ...prev, status: "in_progress" } : null);
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
    if (!session || !job) return;
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(session.start_time).getTime();
      const durationMinutes = Math.max(1, Math.floor((Date.now() - startTime) / 60000));
      
      await (supabase as any).from("job_sessions").update({ 
        status: "pending_review", 
        end_time: endTime, 
        duration_minutes: durationMinutes 
      }).eq("id", session.id);
      
      await (supabase as any).from("job_postings").update({ 
        status: "pending_review" 
      }).eq("id", job.id);

      // Refetch to ensure state matches DB exactly
      const { data: updatedSession } = await (supabase as any).from("job_sessions").select("*").eq("id", session.id).maybeSingle();
      setSession(updatedSession);
      setJob(prev => prev ? { ...prev, status: "pending_review" } : null);
      toast.success("Session ended. Both parties can now submit proof of completion. 📸");
    } catch (err: any) { toast.error(err.message || "Failed to end session"); }
  };

  const uploadProofImage = async (file: File, role: "freelancer" | "customer") => {
    setUploadingProof(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `job-proofs/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("job-proofs").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("job-proofs").getPublicUrl(path);
      
      if (role === "freelancer") {
        setFreelancerProof(prev => prev + (prev ? "\n" : "") + publicUrl);
      } else {
        setCustomerProof(prev => prev + (prev ? "\n" : "") + publicUrl);
      }
      toast.success("Image uploaded!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed. Make sure 'job-proofs' bucket exists in Supabase.");
    }
    setUploadingProof(false);
  };

  const submitProof = async (role: "freelancer" | "customer") => {
    if (!session || !user) return;
    const proofText = role === "freelancer" ? freelancerProof : customerProof;
    if (!proofText.trim()) {
      toast.error("Please describe the work completed or upload an image");
      return;
    }
    
    setUploadingProof(true);
    try {
      const updateData: any = {};
      if (role === "freelancer") {
        updateData.freelancer_proof = proofText.trim();
        updateData.freelancer_proof_submitted_at = new Date().toISOString();
      } else {
        updateData.customer_proof = proofText.trim();
        updateData.customer_proof_submitted_at = new Date().toISOString();
      }
      
      const { error } = await (supabase as any).from("job_sessions").update(updateData).eq("id", session.id);
      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      
      // CRITICAL: Refetch session to prevent state drift and timer restart
      const { data: updatedSession } = await (supabase as any).from("job_sessions").select("*").eq("id", session.id).maybeSingle();
      if (updatedSession) setSession(updatedSession);
      
      toast.success(`${role === "freelancer" ? "Freelancer" : "Customer"} proof submitted! ✅`);
    } catch (err: any) { 
      console.error("Proof submission failed:", err);
      toast.error(err.message || "Failed to submit proof. Check console for details."); 
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!job) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4"><p className="text-muted-foreground mb-4">Job not found</p><Button onClick={() => navigate("/jobs")}>Back to Jobs</Button></div>;

  const isExpired = new Date(job.expires_at) < new Date();
  const isClient = job.client_id === user?.id;
  const isHiredFreelancer = session?.freelancer_id === user?.id;
  const hasBid = bids.some(b => b.freelancer_id === user?.id);

  // Helper to render proof text with image URLs
  const renderProofContent = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("http") && (line.includes(".jpg") || line.includes(".png") || line.includes(".jpeg") || line.includes(".webp"))) {
        return <img key={i} src={line} alt="Proof" className="w-full max-h-48 object-contain rounded-lg border border-border mt-2" />;
      }
      return <p key={i} className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{line}</p>;
    });
  };

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
                job.status === 'open' ? 'bg-green-100 text-green-700' :
                job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                job.status === 'pending_review' ? 'bg-purple-100 text-purple-700' :
                job.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                'bg-muted text-muted-foreground'
              }`}>{job.status.replace('_', ' ').toUpperCase()}</span>
            )}
          </div>
          <h1 className="text-xl font-bold leading-tight mb-2">{job.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /><span>{job.location}</span></div>
            <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>₱{job.hourly_rate}/hr</span></div>
            <div className="flex items-center gap-1"><Timer className="h-4 w-4" />
              {job.status === "in_progress" || job.status === "pending_review" || job.status === "completed" 
                ? <span className="text-green-600 font-bold">Session Active</span> 
                : <span>Expires: {new Date(job.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
          </div>
        </div>

        {/* Rejected Bid Notice */}
        {myBidStatus === "rejected" && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
            <Ban className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-destructive">Your bid was not selected</p>
              <p className="text-xs text-destructive/80 mt-1">The client chose another freelancer for this job. You can still view the job details, but you cannot participate in this session.</p>
            </div>
          </div>
        )}

        {/* Escrow Payment Notice (Client View) */}
        {isClient && job.status === "pending_payment" && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300">Secure Your Escrow Payment</h3>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Before your job can be approved, you must first hand over the payment to the BizMart staff. This payment will be securely held by the admin as an escrow to ensure a safe and fair transaction.
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
                <h2 className="font-bold text-sm mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Specific Requirements</h2>
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
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/20 rounded-lg"><Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground">No bids yet.</p></div>
            )}
          </div>
        )}

        {/* Session Management */}
        {session && (
          <div className="bg-card rounded-xl p-4 border border-border space-y-4">
            <h2 className="font-bold text-sm flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Session Details</h2>
            
            {/* Session Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Status</p>
                <p className="text-sm font-bold capitalize">{session.status.replace('_', ' ')}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Location</p>
                <p className="text-sm font-bold">{job.location}</p>
              </div>
              {session.start_time && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Started</p>
                  <p className="text-xs font-bold">{new Date(session.start_time).toLocaleString()}</p>
                </div>
              )}
              {session.end_time && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Ended</p>
                  <p className="text-xs font-bold">{new Date(session.end_time).toLocaleString()}</p>
                </div>
              )}
              {session.duration_minutes !== undefined && session.duration_minutes !== null && (
                <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Duration</p>
                  <p className="text-lg font-extrabold text-primary">{session.duration_minutes} minutes</p>
                </div>
              )}
            </div>

            {/* Active Session Timer */}
            {session.status === "active" && (
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Session Duration</p>
                <p className="text-3xl font-extrabold text-primary font-mono">{formatTime(sessionTimer)}</p>
                {isClient && (
                  <Button onClick={endSession} variant="destructive" className="w-full mt-3 h-10 font-bold rounded-xl">End Session</Button>
                )}
              </div>
            )}

            {/* Scheduled Session */}
            {session.status === "scheduled" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Session is scheduled. Meet at the agreed location.</p>
                {isClient && <Button onClick={startSession} className="w-full h-11 font-bold rounded-xl"><Timer className="h-4 w-4 mr-2" /> Start Session</Button>}
              </div>
            )}

            {/* Pending Review - Both can submit proof */}
            {session.status === "pending_review" && (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    <p className="text-xs font-bold text-amber-700">Awaiting Admin Review</p>
                  </div>
                  <p className="text-[10px] text-amber-600">Both parties must submit proof of completion. Admin will review and approve.</p>
                </div>

                {/* Freelancer Proof Submission */}
                {isHiredFreelancer && !session.freelancer_proof_submitted_at && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Submit Your Accomplishment Report</Label>
                    <Textarea 
                      placeholder="Describe the work you completed, how you followed the instructions, and the results..." 
                      value={freelancerProof} 
                      onChange={(e) => setFreelancerProof(e.target.value)} 
                      className="text-xs" 
                      rows={3} 
                    />
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="freelancer-proof-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadProofImage(file, "freelancer");
                        }}
                      />
                      <label htmlFor="freelancer-proof-upload" className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-xs font-medium">
                        <ImageIcon className="h-4 w-4" /> Upload Image
                      </label>
                      <Button onClick={() => submitProof("freelancer")} disabled={uploadingProof} className="flex-1 h-10 text-xs">
                        {uploadingProof ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />} 
                        Submit Proof
                      </Button>
                    </div>
                  </div>
                )}

                {session.freelancer_proof && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <p className="text-xs font-bold text-green-700">Freelancer Proof Submitted</p>
                    </div>
                    {renderProofContent(session.freelancer_proof)}
                    <p className="text-[9px] text-muted-foreground mt-2">Submitted: {new Date(session.freelancer_proof_submitted_at).toLocaleString()}</p>
                  </div>
                )}

                {/* Customer Proof Submission */}
                {isClient && !session.customer_proof_submitted_at && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> Submit Your Completion Confirmation</Label>
                    <Textarea 
                      placeholder="Confirm that the work was completed satisfactorily. Describe what was accomplished..." 
                      value={customerProof} 
                      onChange={(e) => setCustomerProof(e.target.value)} 
                      className="text-xs" 
                      rows={3} 
                    />
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id="customer-proof-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadProofImage(file, "customer");
                        }}
                      />
                      <label htmlFor="customer-proof-upload" className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-xs font-medium">
                        <ImageIcon className="h-4 w-4" /> Upload Image
                      </label>
                      <Button onClick={() => submitProof("customer")} disabled={uploadingProof} className="flex-1 h-10 text-xs">
                        {uploadingProof ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />} 
                        Submit Proof
                      </Button>
                    </div>
                  </div>
                )}

                {session.customer_proof && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <p className="text-xs font-bold text-green-700">Customer Proof Submitted</p>
                    </div>
                    {renderProofContent(session.customer_proof)}
                    <p className="text-[9px] text-muted-foreground mt-2">Submitted: {new Date(session.customer_proof_submitted_at).toLocaleString()}</p>
                  </div>
                )}

                {session.freelancer_proof_submitted_at && session.customer_proof_submitted_at && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-green-700">Both proofs submitted!</p>
                    <p className="text-[10px] text-green-600">Waiting for admin review and approval.</p>
                  </div>
                )}
              </div>
            )}

            {/* Completed Session */}
            {session.status === "completed" && session.escrow_released && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-green-700">Job Completed & Payment Released</p>
                <p className="text-[10px] text-green-600 mt-1">80% to freelancer, 10% maintenance, 10% admin</p>
              </div>
            )}
          </div>
        )}

        {/* Bid Form (Freelancer View) */}
        {isFreelancer && (job.status === "ready_to_start" || job.status === "open" || job.status === "approved") && !hasBid && !isClient && (
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

        {hasBid && (job.status === "ready_to_start" || job.status === "open" || job.status === "approved") && (
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