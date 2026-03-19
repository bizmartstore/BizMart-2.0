import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, User, Star, CheckCircle2, AlertCircle, Play, Square, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function JobDetailPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [timer, setTimer] = useState(0);

  const loadData = useCallback(async () => {
    if (!id || !user) return;

    const { data: jobData } = await (supabase as any)
      .from("job_postings")
      .select("*, client:profiles!job_postings_client_id_fkey(*)")
      .eq("id", id)
      .maybeSingle();
    
    if (!jobData) {
      toast.error("Job not found");
      navigate("/jobs");
      return;
    }
    setJob(jobData);

    const { data: bidData } = await (supabase as any)
      .from("job_bids")
      .select("*, freelancer:profiles!job_bids_freelancer_id_fkey(*)")
      .eq("job_id", id)
      .order("created_at", { ascending: false });
    setBids(bidData || []);

    const { data: sessionData } = await (supabase as any)
      .from("job_sessions")
      .select("*")
      .eq("job_id", id)
      .maybeSingle();
    setSession(sessionData);

    const { data: freelancer } = await (supabase as any)
      .from("freelancer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();
    setIsFreelancer(!!freelancer);

    setLoading(false);
  }, [id, user, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (session?.status === 'active' && session?.start_time) {
      const start = new Date(session.start_time).getTime();
      interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleBid = async () => {
    if (!user || !id) return;
    if (Number(bidAmount) < job.hourly_rate) {
      toast.error(`Bid cannot be lower than client's rate (₱${job.hourly_rate})`);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("job_bids").insert({
        job_id: id,
        freelancer_id: user.id,
        bid_rate: Number(bidAmount),
        message: bidMessage.trim(),
      });
      if (error) throw error;
      toast.success("Bid submitted! 🚀");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHire = async (bid: any) => {
    if (!confirm(`Hire ${bid.freelancer.first_name} for ₱${bid.bid_rate}/hr?`)) return;
    setSubmitting(true);
    try {
      // 1. Update job status
      await (supabase as any).from("job_postings").update({
        status: "hired",
        hired_freelancer_id: bid.freelancer_id,
      }).eq("id", id);

      // 2. Create session
      await (supabase as any).from("job_sessions").insert({
        job_id: id,
        freelancer_id: bid.freelancer_id,
        client_id: user!.id,
        status: "active", // In a real app, this would wait for escrow deposit
      });

      toast.success("Freelancer hired! Session is now active. 🤝");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSession = async () => {
    setSubmitting(true);
    try {
      await (supabase as any).from("job_sessions").update({
        start_time: new Date().toISOString(),
        status: "active",
      }).eq("job_id", id);
      toast.success("Session started! Timer is running. ⏱️");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = async () => {
    if (!confirm("End this learning session?")) return;
    setSubmitting(true);
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(session.start_time).getTime();
      const durationHours = Math.max(1, Math.ceil((Date.now() - startTime) / 3600000));
      
      // Find the accepted bid to get the rate
      const acceptedBid = bids.find(b => b.freelancer_id === session.freelancer_id);
      const rate = acceptedBid?.bid_rate || job.hourly_rate;
      const totalCost = durationHours * rate;

      await (supabase as any).from("job_sessions").update({
        end_time: endTime,
        total_cost: totalCost,
        status: "waiting_review",
      }).eq("id", session.id);

      await (supabase as any).from("job_postings").update({
        status: "completed",
      }).eq("id", id);

      toast.success("Session ended! Please upload proof of assistance. 📸");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const isOwner = job.client_id === user?.id;
  const hasBid = bids.some(b => b.freelancer_id === user?.id);
  const canCancel = isOwner && bids.length === 0 && job.status === 'open';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">Job Details</span>
      </div>

      <div className="px-4 mt-6">
        {/* Job Header */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {job.category}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              job.status === 'open' ? 'bg-green-100 text-green-600' :
              job.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
              'bg-muted text-muted-foreground'
            }`}>
              {job.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-lg font-extrabold mb-2">{job.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{job.description}</p>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Location</p>
                <p className="text-xs font-bold">{job.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Posted</p>
                <p className="text-xs font-bold">{formatDistanceToNow(new Date(job.created_at))} ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Session / Timer */}
        {session && (session.status === 'active' || session.status === 'waiting_review') && (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 mb-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 fill-white animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Active Session</span>
              </div>
              <span className="text-2xl font-mono font-bold">{formatTime(timer)}</span>
            </div>
            
            <div className="bg-white/10 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="opacity-80">Agreed Rate</span>
                <span className="font-bold">₱{job.hourly_rate}/hr</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-80">Estimated Cost</span>
                <span className="font-bold">₱{(Math.max(1, Math.ceil(timer / 3600)) * job.hourly_rate).toFixed(2)}</span>
              </div>
            </div>

            {!session.start_time && isOwner && (
              <Button onClick={handleStartSession} className="w-full bg-white text-indigo-600 font-bold hover:bg-white/90">
                Start Session Now
              </Button>
            )}

            {session.start_time && session.status === 'active' && (
              <Button onClick={handleEndSession} variant="destructive" className="w-full font-bold">
                <Square className="h-4 w-4 mr-2 fill-white" /> End Session
              </Button>
            )}

            {session.status === 'waiting_review' && (
              <div className="text-center">
                <p className="text-sm font-bold mb-2">Session Ended</p>
                <p className="text-[10px] opacity-80">Waiting for freelancer to upload proof of assistance.</p>
              </div>
            )}
          </div>
        )}

        {/* Bids Section */}
        {job.status === 'open' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {isOwner ? `Applicants (${bids.length})` : "Submit Your Bid"}
            </h3>

            {!isOwner && isFreelancer && !hasBid && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Your Hourly Rate (₱)</Label>
                  <Input 
                    type="number" 
                    placeholder={`Min ₱${job.hourly_rate}`} 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Message to Client</Label>
                  <Textarea 
                    placeholder="Describe your qualifications and how you can help..." 
                    className="text-xs"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                  />
                </div>
                <Button onClick={handleBid} disabled={submitting} className="w-full font-bold">
                  {submitting ? "Submitting..." : "Apply for this Job"}
                </Button>
              </div>
            )}

            {isOwner && bids.length === 0 && (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                <p className="text-xs text-muted-foreground">Waiting for freelancers to apply...</p>
              </div>
            )}

            <div className="space-y-3">
              {bids.map((bid) => (
                <div key={bid.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {bid.freelancer.first_name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{bid.freelancer.first_name} {bid.freelancer.last_name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[9px] text-muted-foreground">4.9 (12 sessions)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-primary">₱{bid.bid_rate}</p>
                      <p className="text-[9px] text-muted-foreground">per hour</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic mb-4">"{bid.message}"</p>
                  {isOwner && (
                    <Button onClick={() => handleHire(bid)} disabled={submitting} size="sm" className="w-full h-9 rounded-xl font-bold">
                      Hire Freelancer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancellation Rule */}
        {canCancel && (
          <div className="mt-8 pt-6 border-t border-border">
            <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5">
              Cancel Job Posting
            </Button>
            <p className="text-[9px] text-muted-foreground text-center mt-2">
              Note: You can only cancel if no freelancers have applied yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}