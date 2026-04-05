import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Search, Clock, MapPin, Star, ShieldCheck, AlertCircle, ArrowRight, Timer, CheckCircle2, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: "homework", name: "Homework Guidance", color: "bg-blue-500" },
    { id: "study", name: "Study Assistance", color: "bg-green-500" },
    { id: "tutoring", name: "Subject Tutoring", color: "bg-purple-500" },
    { id: "presentation", name: "Presentation Coaching", color: "bg-orange-500" },
    { id: "project", name: "Project Idea Help", color: "bg-pink-500" },
    { id: "editing", name: "Editing Guidance", color: "bg-teal-500" },
    { id: "skills", name: "Academic Skill Support", color: "bg-indigo-500" },
    { id: "creative", name: "Creative Academic Assistance", color: "bg-rose-500" },
  ];

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

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !search.trim() || 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()) ||
      job.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId) || { name: categoryId, color: "bg-gray-500" };
  };

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
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent rounded-full flex items-center justify-center mb-4">
            <Briefcase className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-extrabold text-xl mb-2">BizMart Job Offers</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access educational job offers.</p>
          <Button onClick={() => navigate("/login")} className="w-full max-w-xs h-12 font-bold rounded-xl shadow-lg">
            Login to Continue
          </Button>
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
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ShieldCheck className="h-12 w-12 text-white" />
          </div>
          <h2 className="font-extrabold text-2xl mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Exclusive Feature</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
            BizMart Job Offers is exclusively available to <span className="font-bold text-primary">BizMart Club members</span>. Join the club to request academic assistance or earn by helping others!
          </p>
          <Button onClick={() => navigate("/club")} className="w-full max-w-xs h-12 font-bold rounded-xl shadow-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
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
      
      {/* Hero Section */}
      <div className="px-4 mt-4">
        <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 rounded-2xl p-6 border border-primary/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-extrabold text-2xl text-foreground mb-1">Job Offers</h1>
              <p className="text-sm text-muted-foreground">Peer-to-peer academic assistance</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={() => navigate("/jobs/post")} 
              size="sm" 
              className="flex-1 h-10 text-sm font-bold rounded-xl shadow-md bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" /> Post Job
            </Button>
            {!isFreelancer && (
              <Button 
                onClick={() => navigate("/jobs/apply")} 
                size="sm" 
                variant="outline"
                className="flex-1 h-10 text-sm font-bold rounded-xl border-primary/30"
              >
                Become a Freelancer
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-primary">{jobs.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Active Jobs</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-secondary">{myJobs.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium">My Requests</p>
            </div>
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
              <p className="text-xl font-extrabold text-[hsl(var(--success))]">{myBids.length}</p>
              <p className="text-[10px] text-muted-foreground font-medium">My Bids</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 mt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by subject, category, or keyword..."
            className="w-full pl-10 pr-10 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              selectedCategory === "all" 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${{
                selectedCategory === cat.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 mt-4">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="w-full grid grid-cols-2 lg:grid-cols-3 mb-4 h-11 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="browse" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Browse Jobs
            </TabsTrigger>
            <TabsTrigger value="my-activity" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              My Activity
            </TabsTrigger>
            {isFreelancer && (
              <TabsTrigger value="freelancer" className="rounded-lg text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Freelancer Hub
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">No active job offers found</p>
                <p className="text-xs text-muted-foreground mt-1">Check back later or post your own job request</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const catInfo = getCategoryInfo(job.category);
                  const timeRemaining = getTimeRemaining(job.expires_at);
                  const isUrgent = timeRemaining.includes("h") && parseInt(timeRemaining) < 2;
                  
                  return (
                    <div 
                      key={job.id} 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group overflow-hidden relative"
                    >
                      {/* Urgent indicator */}
                      {isUrgent && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-bl-full -z-10 opacity-20" />
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={`${catInfo.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-full`}
                          >
                            {catInfo.name}
                          </Badge>
                          {isUrgent && (
                            <Badge variant="destructive" className="text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                          <Timer className="h-3 w-3" />
                          {timeRemaining} left
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-base mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {job.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center text-xs font-bold">
                              {job.client?.first_name?.[0]}{job.client?.last_name?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                {job.client?.first_name} {job.client?.last_name}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-extrabold text-primary">₱{job.hourly_rate}</p>
                          <p className="text-[10px] text-muted-foreground">per hour</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-activity">
            <div className="space-y-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> My Job Requests
                </h3>
                {myJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">You haven't posted any jobs yet</p>
                    <Button 
                      onClick={() => navigate("/jobs/post")} 
                      size="sm" 
                      className="mt-3 h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Post Your First Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myJobs.map((job) => (
                      <div 
                        key={job.id} 
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="bg-muted/30 rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{job.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              job.status === 'open' ? 'bg-green-100 text-green-600' :
                              job.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {job.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-[10px] text-muted-foreground">₱{job.hourly_rate}/hr</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isFreelancer && (
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" /> My Bids
                  </h3>
                  {myBids.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No bids submitted yet</p>
                  ) : (
                    <div className="space-y-2">
                      {myBids.map(bid => (
                        <div key={bid.id} className="bg-muted/30 rounded-xl p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{bid.job?.title}</p>
                              <p className="text-[10px] text-muted-foreground">₱{bid.proposed_price} · {bid.status}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                              bid.status === 'accepted' ? 'bg-green-100 text-green-600' :
                              bid.status === 'rejected' ? 'bg-red-100 text-red-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              {bid.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{bid.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {isFreelancer && (
            <TabsContent value="freelancer">
              <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-primary/10 to-accent/20 rounded-xl p-4 border border-primary/20 text-center">
                    <p className="text-2xl font-extrabold text-primary">{myBids.length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Total Bids</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 rounded-xl p-4 border border-blue-500/20 text-center">
                    <p className="text-2xl font-extrabold text-blue-600">{mySessions.filter(s => s.status === 'active').length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Active Sessions</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/20 rounded-xl p-4 border border-green-500/20 text-center">
                    <p className="text-2xl font-extrabold text-green-600">{mySessions.filter(s => s.status === 'completed').length}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Completed</p>
                  </div>
                </div>

                {/* Active Sessions */}
                {mySessions.filter(s => s.status === 'active').length > 0 && (
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Timer className="h-4 w-4 text-primary" /> Active Sessions
                    </h3>
                    {mySessions.filter(s => s.status === 'active').map(session => (
                      <div key={session.id} className="bg-muted/30 rounded-xl p-3 mb-2 last:mb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold">Session #{session.id.slice(0, 6)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Started {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-600 animate-pulse">
                            ACTIVE NOW
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* My Bids */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" /> My Bids
                  </h3>
                  {myBids.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-muted-foreground">No bids submitted yet</p>
                      <Button 
                        onClick={() => navigate("/jobs")} 
                        size="sm" 
                        variant="outline"
                        className="mt-2 h-8 text-xs"
                      >
                        Browse Jobs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myBids.map(bid => (
                        <div 
                          key={bid.id} 
                          onClick={() => navigate(`/jobs/${bid.job?.id}`)}
                          className="bg-muted/30 rounded-xl p-3 cursor-pointer hover:bg-muted/50 transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{bid.job?.title}</p>
                              <p className="text-[10px] text-muted-foreground">₱{bid.proposed_price} · {bid.status}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                              bid.status === 'accepted' ? 'bg-green-100 text-green-600' :
                              bid.status === 'rejected' ? 'bg-red-100 text-red-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              {bid.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{bid.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Policy Reminder */}
      <div className="px-4 mt-6 mb-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300 mb-1">Academic Integrity Policy</h4>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                Freelancers are here to <strong>guide and tutor</strong> you. They are strictly prohibited from completing assignments, projects, or graded work on your behalf. Use this platform responsibly to improve your learning!
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}