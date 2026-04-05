import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, Plus, ShieldCheck, Clock, MapPin, Star, AlertCircle, ArrowRight, Timer, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JobsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isClubMember, setIsClubMember] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [freelancerStatus, setFreelancerStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [mySessions, setMySessions] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      // Check Club Membership
      const { data: membership } = await (supabase as any)
        .from("club_memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      
      setIsClubMember(!!membership);

      // Check Freelancer Status
      const { data: freelancer } = await (supabase as any)
        .from("freelancer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (freelancer) {
        setIsFreelancer(freelancer.status === "approved");
        setFreelancerStatus(freelancer.status);
      }

      // Load Jobs
      const { data: allJobs } = await (supabase as any)
        .from("job_postings")
        .select("*, client:profiles!job_postings_client_id_fkey(*)")
        .eq("status", "open")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      
      setJobs(allJobs || []);

      const { data: userJobs } = await (supabase as any)
        .from("job_postings")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      
      setMyJobs(userJobs || []);

      // Load freelancer bids if approved
      if (freelancer?.status === "approved") {
        const { data: bids } = await (supabase as any)
          .from("job_bids")
          .select("*, job:job_postings(*)")
          .eq("freelancer_id", user.id)
          .order("created_at", { ascending: false });
        setMyBids(bids || []);

        const { data: sessions } = await (supabase as any)
          .from("job_sessions")
          .select("*")
          .eq("freelancer_id", user.id)
          .order("created_at", { ascending: false });
        setMySessions(sessions || []);
      }

      setLoading(false);
    };

    checkAccess();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Briefcase className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">BizMart Job Offers</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access educational job offers.</p>
          <Button onClick={() => navigate("/login")}>Login to Continue</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!isClubMember) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="px-6 mt-12 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-extrabold text-xl mb-3">Exclusive Feature</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            BizMart Job Offers is exclusively available to **BizMart Club members**. Join the club to request academic assistance or earn by helping others!
          </p>
          <Button onClick={() => navigate("/club")} className="w-full h-12 font-bold rounded-xl">
            Join BizMart Club Now
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <div className="px-4 mt-4">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Job Offers</h1>
            <p className="text-sm text-muted-foreground">Peer-to-peer academic assistance</p>
          </div>
          <Button 
            onClick={() => navigate("/jobs/post")} 
            size="sm" 
            variant="outline" 
            className="rounded-xl gap-1.5 font-bold hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-4 w-4" /> Post Job
          </Button>
        </div>

        {/* Enhanced Search & Filter */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Enhanced Job Listing Grid */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active job offers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="bg-card rounded-xl border border-border p-4 shadow-sm hover:scale-[0.98] transition-all cursor-pointer"
                >
                  {/* Enhanced Job Card */}
                  <div className="flex items-start gap-3">
                    {/* Category Badge */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {job.category}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{job.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {job.client?.first_name} {job.client?.last_name} • ₱{job.hourly_rate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      job.status === 'open' ? 'bg-green-100 text-green-600' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {job.client?.first_name} {job.client?.last_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {job.client?.school} • {job.client?.grade_level} • {job.client?.section}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Search & Filter Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input              
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Enhanced Job Listing Section */}
        <div className="space-y-4">
          {/* Enhanced Filter Controls */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1">
          </div>

          {/* Enhanced Job Listing with Improved Cards */}
          {jobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="bg-card rounded-xl border border-border p-3 flex items-start gap-3 hover:scale-[0.98] transition-all cursor-pointer"
            >
              {/* Enhanced Job Header */}
              <div className="flex items-start gap-3">
                {/* Category Badge */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                    {job.category}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold truncate">{job.title}</span>
                    <p className="text-[10px] text-muted-foreground">
                      {job.client?.first_name} {job.client?.last_name} • ₱{job.hourly_rate}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    job.status === 'open' ? 'bg-green-100 text-green-600' :
                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {job.status.toUpperCase()}
                  </span>
                </div>

                {/* Client Info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {job.client?.first_name} {job.client?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.client?.school} • {job.client?.grade_level} • {job.client?.section}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {job.delivery_type === 'delivery' ? '🚚 Delivery' : '🏫 Pickup'}
                    </span>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="flex items-center gap-2 mt-2">
                  {job.status === 'open' && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleHire(job.id, job.freelancer_id, job.proposed_price)}                         
                        disabled={submittingBid}
                        className="flex-1 text-[10px] font-bold bg-primary/20 hover:bg-primary/30"
                      >
                        {submittingBid ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : 'Hire'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleReject(job.id)} 
                        disabled={submittingBid} 
                        className="flex-1 text-[10px] font-bold"
                      >
                        {submittingBid ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : 'Reject'}
                      </Button>
                    </>
                  )}
                  {job.status === 'open' && (
                    <Button 
                      size="sm" 
                      variant="outline"                       
                      onClick={() => navigate(`/jobs/${job.id}`)} 
                      className="flex-1 text-[10px] font-bold hover:bg-primary/20"
                    >
                      <Eye className="h-3 w-3" /> View Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}