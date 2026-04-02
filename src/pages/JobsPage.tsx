import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Search, Filter, Clock, MapPin, Star, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-extrabold text-xl text-foreground">Job Offers</h1>
            <p className="text-xs text-muted-foreground">Peer-to-peer academic assistance</p>
          </div>
          <Button onClick={() => navigate("/jobs/post")} size="sm" className="rounded-xl gap-1.5 font-bold">
            <Plus className="h-4 w-4" /> Post Job
          </Button>
        </div>

        {/* Freelancer Banner */}
        {!isFreelancer && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 mb-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">Earn as a Freelancer! 💰</h3>
                <p className="text-[11px] opacity-90 mb-3">
                  {freelancerStatus === 'pending' 
                    ? "Your application is being reviewed by moderators." 
                    : "Help fellow students with their lessons and earn BCoins."}
                </p>
                {freelancerStatus !== 'pending' && (
                  <Button 
                    onClick={() => navigate("/jobs/apply")} 
                    variant="secondary" 
                    size="sm" 
                    className="h-8 text-[10px] font-bold bg-white text-indigo-600 hover:bg-white/90"
                  >
                    Apply Now
                  </Button>
                )}
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="h-6 w-6 fill-white" />
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4 h-11 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="browse" className="rounded-lg text-xs font-bold">Browse Jobs</TabsTrigger>
            <TabsTrigger value="my-activity" className="rounded-lg text-xs font-bold">My Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search by subject or category..."
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {jobs.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                  <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No active job offers found</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="bg-card border border-border rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {job.category}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                        <Clock className="h-3 w-3" />
                        Expires in {Math.max(0, Math.floor((new Date(job.expires_at).getTime() - Date.now()) / 60000))}m
                      </div>
                    </div>
                    <h3 className="font-bold text-sm mb-1 line-clamp-1">{job.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                          {job.client?.first_name?.[0]}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {job.client?.first_name} {job.client?.last_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-primary">₱{job.hourly_rate}</span>
                        <span className="text-[9px] text-muted-foreground block">per hour</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-activity">
            <div className="space-y-3">
              <h3 className="font-bold text-sm px-1">My Job Requests</h3>
              {myJobs.length === 0 ? (
                <div className="text-center py-8 bg-card rounded-2xl border border-border">
                  <p className="text-xs text-muted-foreground">You haven't posted any jobs yet</p>
                </div>
              ) : (
                myJobs.map((job) => (
                  <div 
                    key={job.id} 
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="bg-card border border-border rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{job.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          job.status === 'open' ? 'bg-green-100 text-green-600' :
                          job.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {job.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">₱{job.hourly_rate}/hr</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Policy Reminder */}
        <div className="mt-8 p-4 bg-muted/30 rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="font-bold text-xs">Academic Integrity Policy</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Freelancers are here to **guide and tutor** you. They are strictly prohibited from completing assignments, projects, or graded work on your behalf. Use this platform responsibly to improve your learning!
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}