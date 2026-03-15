import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crown, AlertTriangle, RefreshCw, Package, Clock, CheckCircle2, XCircle, TrendingUp, Users, MessageCircle, Banknote, Plus, Search, Filter, MapPin, Timer } from "lucide-react";

type TabType = "jobs" | "sessions" | "requests" | "earnings";

export default function JobOffersPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("jobs");
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [jobRequests, setJobRequests] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [earningsHistory, setEarningsHistory] = useState<any[]>([]);

  // Filters
  const [jobSearch, setJobSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");

  // Check if user is an active BizMart Club member
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const checkMembership = async () => {
      try {
        const { data, error } = await supabase
          .from("club_memberships")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (error) throw error;
        setIsMember(!!data);
        setLoading(false);
      } catch (err) {
        console.error("Error checking club membership:", err);
        toast.error("Failed to verify membership status");
        setLoading(false);
      }
    };

    checkMembership();
  }, [user, navigate]);

  // Fetch dashboard data for members
  const fetchData = useCallback(async () => {
    if (!isMember || !user) return;

    setRefreshing(true);
    try {
      // Fetch available job requests with filters
      let jobQuery = supabase
        .from("job_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (jobSearch) {
        jobQuery = jobQuery.or(`title.ilike.%${jobSearch}%,description.ilike.%${jobSearch}%`);
      }

      if (jobTypeFilter !== "all") {
        jobQuery = jobQuery.eq("job_type", jobTypeFilter);
      }

      const { data: jobs } = await jobQuery.limit(20);

      // Fetch active sessions for this user
      const { data: sessions } = await supabase
        .from("job_sessions")
        .select(`
          *,
          job_request:job_requests(title, description, reward, duration_minutes)
        `)
        .eq("assistant_id", user.id)
        .in("status", ["accepted", "in_progress"])
        .order("started_at", { ascending: false });

      // Fetch assistance requests made by this user
      const { data: requests } = await supabase
        .from("assistance_requests")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch assistance requests assigned to this user (as assistant)
      const { data: assignedRequests } = await supabase
        .from("assistance_requests")
        .select("*")
        .eq("assigned_to", user.id)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false });

      // Calculate total earnings from completed jobs
      const { data: transactions } = await supabase
        .from("job_earnings")
        .select("amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch detailed earnings history with job info
      const { data: earningsData } = await supabase
        .from("job_earnings")
        .select(`
          *,
          job_session:job_sessions(
            job_request:job_requests(title)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setJobRequests(jobs || []);
      setActiveSessions(sessions || []);
      setAssistanceRequests([...requests || [], ...assignedRequests || []);
      setEarnings(
        transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
      );
      setEarningsHistory(earningsData || []);
    } catch (err) {
      console.error("Error fetching job offers data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setRefreshing(false);
    }
  }, [isMember, user, jobSearch, jobTypeFilter]);

  useEffect(() => {
    if (isMember) {
      fetchData();
    }
  }, [isMember, fetchData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !isMember) return;

    const channel1 = supabase
      .channel("job-requests-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_requests" },
        () => fetchData()
      )
      .subscribe();

    const channel2 = supabase
      .channel("job-sessions-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_sessions", filter: `assistant_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    const channel3 = supabase
      .channel("assistance-requests-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assistance_requests", filter: `requester_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    const channel4 = supabase
      .channel("job-earnings-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_earnings", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
      supabase.removeChannel(channel4);
    };
  }, [user, isMember, fetchData]);

  const handleAcceptJob = async (jobId: string) => {
    if (!user) return;

    try {
      // Check if already applied
      const { data: existingSession } = await supabase
        .from("job_sessions")
        .select("*")
        .eq("job_request_id", jobId)
        .eq("assistant_id", user.id)
        .maybeSingle();

      if (existingSession) {
        toast.error("You have already applied for this job");
        return;
      }

      // Create job session
      const { error } = await supabase
        .from("job_sessions")
        .insert({
          job_request_id: jobId,
          assistant_id: user.id,
          status: "accepted"
        });

      if (error) throw error;

      toast.success("Job accepted! Check your active sessions.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept job");
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("job_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session completed! Earnings will be added to your wallet.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete session");
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("job_sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session cancelled");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel session");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("assistance_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request cancelled");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel request");
    }
  };

  const handleAcceptOffer = async (requestId: string) => {
    if (!user) return;

    try {
      // Update the assistance request to mark as accepted and assign assistant
      const { error } = await supabase
        .from("assistance_requests")
        .update({
          status: "accepted",
          assigned_to: user.id
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Offer accepted! You're now assigned to this request.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept offer");
    }
  };

  const handleCreateRequest = async () => {
    // Navigate to create request form (could be a modal or separate page)
    toast.info("Create request form coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mb-6">
            BizMart Job Offers is exclusive to active BizMart Club members. 
            Join the club to access job opportunities and start earning!
          </p>
          <Button onClick={() => navigate("/club")} className="w-full max-w-xs">
            <Crown className="h-4 w-4 mr-2" />
            Join BizMart Club
          </Button>
          <p className="text-xs text-muted-foreground mt-4 max-w-xs">
            Membership includes: VIP job access, priority assistance, exclusive earning opportunities, and more!
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-extrabold text-lg text-foreground">BizMart Job Offers</h1>
            <p className="text-xs text-muted-foreground">Find work, earn BCoins, build your resume</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRefreshing(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Earnings Overview Card */}
        <div className="bg-gradient-to-br from-[hsl(var(--success))] to-[hsl(142,70%,40%)] rounded-2xl p-5 text-primary-foreground mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              <span className="font-bold text-sm">Total Earnings</span>
            </div>
            <span className="text-3xl font-extrabold">{earnings.toFixed(1)} BCoins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] opacity-80">
              {earningsHistory.filter(e => e.status === 'pending').length} pending payments
            </div>
            <div className="h-4 w-px bg-white/30" />
            <div className="text-[10px] opacity-80">
              {earningsHistory.filter(e => e.status === 'paid').length} paid
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {([
            { id: "jobs", label: "Available Jobs", icon: Package },
            { id: "sessions", label: "My Sessions", icon: Clock },
            { id: "requests", label: "My Requests", icon: MessageCircle },
            { id: "earnings", label: "Earnings", icon: TrendingUp },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter for Jobs */}
        {activeTab === "jobs" && (
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search jobs..."
                className="pl-9 text-sm h-9"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { value: "all", label: "All Types" },
                { value: "tutoring", label: "Tutoring" },
                { value: "event_help", label: "Event Help" },
                { value: "delivery", label: "Delivery" },
                { value: "tech_support", label: "Tech Support" },
                { value: "errand", label: "Errand" },
                { value: "other", label: "Other" },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setJobTypeFilter(type.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                    jobTypeFilter === type.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "jobs" && (
          <div className="space-y-3">
            {jobRequests.length > 0 ? (
              jobRequests.map((job) => (
                <div key={job.id} className="bg-card rounded-xl p-4 border border-shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground mb-1">{job.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className="text-lg font-extrabold text-primary">{job.reward} BCoins</span>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {job.duration_minutes} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {job.job_type.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </span>
                    {job.required_skills && job.required_skills.length > 0 && (
                      <span className="text-[9px] bg-accent text-accent-foreground px-2 py-1 rounded-full">
                        {job.required_skills.length} skill{job.required_skills.length !== 1 ? 's' : ''} required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      Posted {new Date(job.created_at).toLocaleDateString()}
                      {job.current_applicants > 0 && (
                        <span className="ml-2">
                          • {job.current_applicants}/{job.max_applicants} applicants
                        </span>
                      )}
                    </p>
                    <Button
                      onClick={() => handleAcceptJob(job.id)}
                      size="sm"
                      disabled={job.current_applicants >= job.max_applicants}
                      className="gap-1"
                    >
                      <Users className="h-3 w-3" />
                      {job.current_applicants >= job.max_applicants ? "Filled" : "Apply Now"}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {jobSearch || jobTypeFilter !== "all"
                    ? "No jobs match your filters"
                    : "No available jobs right now"}
                </p>
                <Button
                  onClick={() => {
                    setJobSearch("");
                    setJobTypeFilter("all");
                  }}
                  size="sm"
                  variant="outline"
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-3">
            {activeSessions.length > 0 ? (
              activeSessions.map((session) => (
                <div key={session.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground mb-1">
                        {session.job_request?.title || "Job Session"}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {session.job_request?.description || session.notes || "No description"}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ml-2 ${
                      session.status === 'accepted'
                        ? 'bg-warning/20 text-warning'
                        : session.status === 'in_progress'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {session.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {session.job_request?.duration_minutes || 0} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" />
                      {session.job_request?.reward || 0} BCoins
                    </span>
                    <span className="text-[9px]">
                      Started {new Date(session.started_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {session.status === 'accepted' && (
                      <Button
                        onClick={() => handleCompleteSession(session.id)}
                        size="sm"
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Start Work
                      </Button>
                    )}
                    {session.status === 'in_progress' && (
                      <Button
                        onClick={() => handleCompleteSession(session.id)}
                        size="sm"
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Complete
                      </Button>
                    )}
                    {(session.status === 'accepted' || session.status === 'in_progress') && (
                      <Button
                        onClick={() => handleCancelSession(session.id)}
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive"
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No active sessions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Accept a job to get started!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="space-y-3">
            {assistanceRequests.length > 0 ? (
              assistanceRequests.map((req) => (
                <div key={req.id} className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground mb-1">{req.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ml-2 ${
                      req.status === 'pending'
                        ? 'bg-warning/20 text-warning'
                        : req.status === 'accepted' || req.status === 'in_progress'
                        ? 'bg-primary/20 text-primary'
                        : req.status === 'completed'
                        ? 'bg-success/20 text-[hsl(var(--success))]'
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {req.assistance_type.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {req.location}
                    </span>
                    <span className="text-[9px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] px-2 py-1 rounded-full">
                      {req.offer} BCoins
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString()}
                      {req.assigned_to && (
                        <span className="ml-2 text-primary">
                          • Assigned to you
                        </span>
                      )}
                    </p>
                    {req.status === 'pending' && req.requester_id === user?.id && (
                      <Button
                        onClick={() => handleCancelRequest(req.id)}
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive"
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </Button>
                    )}
                    {req.status === 'pending' && req.assigned_to !== user?.id && (
                      <Button
                        onClick={() => handleAcceptOffer(req.id)}
                        size="sm"
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Accept Offer
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No assistance requests</p>
                <Button onClick={handleCreateRequest} size="sm" className="mt-3 gap-1">
                  <Plus className="h-3 w-3" />
                  Create Request
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-3">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Earnings Summary</h3>
                <span className="text-2xl font-extrabold text-[hsl(var(--success))]">
                  {earnings.toFixed(1)} BCoins
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Completed Jobs</p>
                  <p className="text-lg font-bold">
                    {earningsHistory.filter(e => e.status === 'paid').length}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">Pending</p>
                  <p className="text-lg font-bold text-warning">
                    {earningsHistory.filter(e => e.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-bold text-sm mb-3">Recent Earnings</h3>
              {earningsHistory.length > 0 ? (
                <div className="space-y-2">
                  {earningsHistory.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {earning.job_session?.job_request?.title || "Job Payment"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(earning.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          earning.status === 'paid'
                            ? 'text-[hsl(var(--success))]'
                            : 'text-warning'
                        }`}>
                          +{earning.amount} BCoins
                        </p>
                        <p className={`text-[9px] ${
                          earning.status === 'paid'
                            ? 'text-[hsl(var(--success))]'
                            : 'text-warning'
                        }`}>
                          {earning.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4">
                  No earnings yet. Complete jobs to start earning!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}