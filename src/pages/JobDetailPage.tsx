import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, MapPin, Star, CheckCircle2, XCircle, Loader2, Palette, FileText, User, MapPin, Search } from "lucide-react";
import { sendNotification } from "@/lib/notifications";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [isFullyReviewed, setIsFullyReviewed] = useState(false); // NEW: computed state  // Load job and session data
  const loadJobAndSession = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Load job details
      const { data: jobData, error: jobError } = await (supabase as any).from("job_postings").select("*, client:profiles!job_postings_client_id_fkey(*)").eq("id", id).maybeSingle();
      if (jobError) throw jobError;
      setJob(jobData);

      // Load bids
      const { data: bidsData, error: bidsError } = await (supabase as any).from("job_bids").select("*").eq("job_id", id).order("created_at", { ascending: false });
      if (bidsError) throw bidsError;
      setBids(bidsData || []);

      // Load session
      const { data: sessionData, error: sessionError } = await (supabase as any).from("job_sessions").select("*").eq("job_id", id).maybeSingle();
      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Determine if fully reviewed
      const freelancerSubmitted = session?.freelancer_proof_submitted_at;
      const customerSubmitted = session?.customer_proof_submitted_at;
      setIsFullyReviewed(!!freelancerSubmitted && !!customerSubmitted);

      // Determine if user already submitted a bid
      const myBid = bids.find((b: any) => b.freelancer_id === user?.id);
      setMyBidStatus(myBid ? myBid.status : null);
    } catch (err: any) {
      console.error("Failed to load job/session:", err);
      toast.error(err.message || "Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Keep session updated via real-time channel
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`job-session-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_sessions", filter: `job_id=eq.${id}` }, (payload: any) => {
        // Merge new data instead of replacing entire session
        setSession(prev => ({ ...prev, ...payload.new }));
        // Re‑evaluate fully reviewed state
        const freelancerSubmitted = payload.new?.freelancer_proof_submitted_at;
        const customerSubmitted = payload.new?.customer_proof_submitted_at;
        setIsFullyReviewed(!!freelancerSubmitted && !!customerSubmitted);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  // Load job and session when id changes
  useEffect(() => {
    loadJobAndSession();
  }, [id]);

  // Timer logic – recalculates every second
  useEffect(() => {
    if (!loading && session?.status === "active") {
      const interval = setInterval(() => {
        const elapsed = Date.now() - new Date(session.start_time).getTime();
        const totalSeconds = Math.floor(elapsed / 1000);
        setSessionTimer(totalSeconds);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, session]);

  // Helper to determine if the session is fully reviewed  const isFullyReviewed = useMemo(() => {
    return !!session?.freelancer_proof_submitted_at && !!session?.customer_proof_submitted_at;
  }, [session]);

  // Helper to format remaining time  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Submit a new bid  const handleBid = async () => {
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
      await loadBids();
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
      await (supabase as any).from("job_postings").update({
        status: "in_progress",
        hired_freelancer_id: freelancerId,
        escrow_amount: price,
      }).eq("id", job.id);
      // Notify admin about new bid
      await sendNotification({
        title: "📝 New Bid Received",
        message: `${user?.email} placed a bid of ₱${price} on "${job.title}".`,
        type: "new_bid",
        targetRole: "admin",
        link: "/admin?tab=jobs",
        icon: "📝",
      });
      // Notify the freelancer
      await sendNotification({
        title: "🎉 You Were Hired!",
        message: `Client selected you for "${job.title}". Check the job details to start the session.`,
        type: "freelancer_hired",
        userId: freelancerId,
        link: "/jobs",
        icon: "🎉",
      });
      // Update local state
      setBids((prev) => prev.map((b: any) => (b.id === bidId ? { ...b, status: "accepted" } : b)));
      toast.success("Freelancer hired! Session scheduled. 🤝");
    } catch (err: any) {
      console.error("Hire error:", err);
      toast.error(err.message || "Failed to hire freelancer");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Start a session (only for active jobs)
  const startSession = async () => {
    if (!session) return;
    try {
      await (supabase as any).from("job_sessions").update({
        status: "active",
        start_time: new Date().toISOString(),
      }).eq("id", session.id);
      toast.success("Session started! ⏱️ Timer is running.");
    } catch (err: any) {
      console.error("Start session error:", err);
      toast.error(err.message || "Failed to start session");
    }
  };

  // End a session (mark as completed)
  const endSession = async () => {
    if (!session) return;
    try {
      const endTime = new Date().toISOString();
      await (supabase as any).from("job_sessions").update({
        status: "completed",
        end_time: endTime,
      }).eq("id", session.id);
      // Mark job as completed
      await (supabase as any).from("job_postings").update({
        status: "completed",
      }).eq("id", job.id);
      toast.success("Session ended! 🎉");
      // Refresh job data to reflect completed status
      const { data: updatedJob } = await (supabase as any).from("job_postings").select("*").eq("id", job.id).single();
      setJob(updatedJob);
    } catch (err: any) {
      console.error("End session error:", err);
      toast.error(err.message || "Failed to end session");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Submit proof (freelancer or customer)
  const submitProof = async (role: "freelancer" | "customer") => {
    if (!session) return;
    const proofText = role === "freelancer" ? freelancerProof : customerProof;
    if (!proofText.trim()) {
      toast.error("Please describe the work completed or upload an image");
      return;
    }
    setUploadingProof(true);
    try {
      const ext = proofText.split(".").pop();
      const path = `job-proofs/${user.id}/${Date.now()}.${ext}`;
      const { error } = await (supabase as any).from("job_proofs").upload(path, proofText as File);
      if (error) throw error;
      const { data: { publicUrl } } = await (supabase as any).from("job_proofs").getPublicUrl(path);
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
    } catch (err: any) {
      console.error("Proof upload error:", err);
      toast.error(err.message || "Failed to upload proof");
    } finally {
      setUploadingProof(false);
    }
  };

  // Helper to determine if the session is fully reviewed
  const isFullyReviewed = useMemo(() => {
    return !!session?.freelancer_proof_submitted_at && !!session?.customer_proof_submitted_at;
  }, [session]);

  // Helper to format remaining time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Timer logic – recalculates every second
  useEffect(() => {
    if (!loading && session?.status === "active") {
      const interval = setInterval(() => {
        const elapsed = Date.now() - new Date(session.start_time).getTime();
        const remaining = Math.max(0, Math.floor((session.end_time?.getTime() ?? 0 - Date.now()) / 1000));
        setSessionTimer(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, session]);

  // When the job ID changes, reload everything
  useEffect(() => {
    loadJobAndSession();
  }, [id]);

  // Real‑time updates for bids
  useEffect(() => {
    const channel = supabase      .channel("job-bids")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_bids" }, () => loadBids())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Real‑time updates for sessions
  useEffect(() => {
    const channel = supabase
      .channel(`job-sessions-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_sessions" }, () => {
        // Merge new data into existing session instead of replacing it
        setSession((prev) => ({ ...prev, ...supabase.from("job_sessions").select("*").eq("id", session?.id).maybeResult?.data }));
        // Re‑evaluate fully reviewed state
        const freelancerSubmitted = session?.freelancer_proof_submitted_at;
        const customerSubmitted = session?.customer_proof_submitted_at;
        setIsFullyReviewed(!!freelancerSubmitted && !!customerSubmitted);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // When the job ID changes, reload everything  useEffect(() => {
    loadJobAndSession();
  }, [id]);

  // Auto‑refresh timer when session is active
  useEffect(() => {
    if (session?.status === "active") {
      const interval = setInterval(() => {
        const elapsed = Date.now() - new Date(session.start_time).getTime();
        const remaining = Math.max(0, Math.floor((session.end_time?.getTime() ?? 0 - Date.now()) / 1000));
        setSessionTimer(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, session]);

  // Helper to determine if the session is fully reviewed
  const isFullyReviewed = useMemo(() => {
    return !!session?.freelancer_proof_submitted_at && !!session?.customer_proof_submitted_at;
  }, [session]);

  // Render helper
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

  // Render helper for timer  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Submit a new bid  const handleBid = async () => {
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
      await loadBids();
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
      await (supabase as any).from("job_postings").update({
        status: "in_progress",
        hired_freelancer_id: freelancerId,
        escrow_amount: price,
      }).eq("id", job.id);
      // Notify admin about new bid
      await sendNotification({
        title: "📝 New Bid Received",
        message: `${user?.email} placed a bid of ₱${price} on "${job.title}".`,
        type: "new_bid",
        targetRole: "admin",
        link: "/admin?tab=jobs",
        icon: "📝",
      });
      // Notify the freelancer
      await sendNotification({
        title: "🎉 You Were Hired!",
        message: `Client selected you for "${job.title}". Check the job details to start the session.`,
        type: "freelancer_hired",
        userId: freelancerId,
        link: "/jobs",
        icon: "🎉",
      });
      // Update local state
      setBids((prev) => prev.map((b: any) => (b.id === bidId ? { ...b, status: "accepted" } : b)));
      toast.success("Freelancer hired! Session scheduled. 🤝");
    } catch (err: any) {
      console.error("Hire error:", err);
      toast.error(err.message || "Failed to hire freelancer");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Start a session (only for active jobs)
  const startSession = async () => {
    if (!session) return;
    try {
      await (supabase as any).from("job_sessions").update({
        status: "active",
        start_time: new Date().toISOString(),
      }).eq("id", session.id);
      toast.success("Session started! ⏱️ Timer is running.");
    } catch (err: any) {
      console.error("Start session error:", err);
      toast.error(err.message || "Failed to start session");
    }
  };

  // End a session (mark as completed)
  const endSession = async () => {
    if (!session) return;
    try {
      const endTime = new Date().toISOString();
      await (supabase as any).from("job_sessions").update({
        status: "completed",
        end_time: endTime,
      }).eq("id", session.id);
      // Mark job as completed
      await (supabase as any).from("job_postings").update({
        status: "completed",
      }).eq("id", job.id);
      toast.success("Session ended! 🎉");
      // Refresh job data to reflect completed status
      const { data: updatedJob } = await (supabase as any).from("job_postings").select("*").eq("id", job.id).single();
      setJob(updatedJob);
    } catch (err: any) {
      console.error("End session error:", err);
      toast.error(err.message || "Failed to end session");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Submit proof (freelancer or customer)
  const submitProof = async (role: "freelancer" | "customer") => {
    if (!session) return;
    const proofText = role === "freelancer" ? freelancerProof : customerProof;
    if (!proofText.trim()) {
      toast.error("Please describe the work completed or upload an image");
      return;
    }
    setUploadingProof(true);
    try {
      const ext = proofText.split(".").pop();
      const path = `job-proofs/${user.id}/${Date.now()}.${ext}`;
      const { error } = await (supabase as any).from("job_proofs").upload(path, proofText as File);
      if (error) throw error;
      const { data: { publicUrl } } = await (supabase as any).from("job_proofs").getPublicUrl(path);
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
    } catch (err: any) {
      console.error("Proof upload error:", err);
      toast.error(err.message || "Failed to upload proof");
    } finally {
      setUploadingProof(false);
    }
  };

  // Helper to determine if the session is fully reviewed
  const isFullyReviewed = useMemo(() => {
    return !!session?.freelancer_proof_submitted_at && !!session?.customer_proof_submitted_at;
  }, [session]);

  // Helper to format remaining time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Timer logic – recalculates every second
  useEffect(() => {
    if (!loading && session?.status === "active") {
      const interval = setInterval(() => {
        const elapsed = Date.now() - new Date(session.start_time).getTime();
        const remaining = Math.max(0, Math.floor((session.end_time?.getTime() ?? 0 - Date.now()) / 1000));
        setSessionTimer(remaining);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, session]);

  // When the job ID changes, reload everything
  useEffect(() => {
    loadJobAndSession();
  }, [id]);

  // Real‑time updates for bids
  useEffect(() => {
    const channel = supabase      .channel("job-bids")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_bids" }, () => loadBids())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Real‑time updates for sessions
  useEffect(() => {
    const channel = supabase
      .channel(`job-sessions-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "job_sessions" }, () => {
        // Merge new data into existing session instead of replacing it
        setSession((prev) => ({ ...prev, ...supabase.from("job_sessions").select("*").eq("id", session?.id).maybeResult?.data }));
        // Re‑evaluate fully reviewed state
        const freelancerSubmitted = session?.freelancer_proof_submitted_at;
        const customerSubmitted = session?.customer_proof_submitted_at;
        setIsFullyReviewed(!!freelancerSubmitted && !!customerSubmitted);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // When the job ID changes, reload everything  useEffect(() => {
    loadJobAndSession();
  }, [id]);

  // Helper functions (unchanged)
  const loadBids = useCallback(async () => {
    try {
      const { data: bidsData, error } = await (supabase as any).from("job_bids").select("*").eq("job_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      setBids(bidsData || []);
    } catch (err: any) {
      console.error("Failed to load bids:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ... (rest of the component remains unchanged, only the UI conditions now use isFullyReviewed)
  // ... (the rest of the component code is omitted for brevity in this diff) ...