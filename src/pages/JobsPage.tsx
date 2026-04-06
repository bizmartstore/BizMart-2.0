// ... existing imports ...

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
  const [activeFreelancers, setActiveFreelancers] = useState<FreelancerProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"browse" | "freelancers" | "my-activity">("browse");
  const scrollRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [lastJobUpdate, setLastJobUpdate] = useState<string | null>(null);

  // ... existing categories array ...

  const loadAllData = useCallback(async () => {
    if (!user) return;
    
    const { data: membership } = await (supabase as any)
      .from("club_memberships")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    setIsClubMember(!!membership);

    const { data: freelancer } = await (supabase as any)
      .from("freelancer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (freelancer) {
      setIsFreelancer(freelancer.status === "approved");
      setFreelancerStatus(freelancer.status);
    }

    // Only show approved & ready_to_start jobs to public
    const { data: allJobs } = await (supabase as any)
      .from("job_postings")
      .select("*, client:profiles!job_postings_client_id_fkey(*)")
      .in("status", ["approved", "ready_to_start", "open", "in_progress", "pending_review"])
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setJobs(allJobs || []);

    const { data: userJobs } = await (supabase as any)
      .from("job_postings")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    setMyJobs(userJobs || []);

    if (freelancer?.status === "approved") {
      const { data: bids } = await (supabase as any)
        .from("job_bids")
        .select("*, job:job_postings(*)")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false });
      setMyBids(bids || []);

      const { data: sessions } = await (supabase as any)
        .from("job_sessions")
        .select("*, job:job_postings(*)")
        .eq("freelancer_id", user.id)
        .order("created_at", { ascending: false });
      setMySessions(sessions || []);
    }

    const { data: freelancers } = await (supabase as any)
      .from("freelancer_profiles")
      .select(`
        *,
        profile:profiles!freelancer_profiles_user_id_fkey(
          first_name, last_name, email, avatar_url, school, grade_level, section
        )
      `)
      .eq("status", "approved")
      .order("rating", { ascending: false });
    setActiveFreelancers(freelancers || []);
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    loadAllData().then(() => setLoading(false));

    const channel = supabase
      .channel("jobs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_postings" }, () => loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "job_bids" }, () => loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "job_sessions" }, () => loadAllData())
      .on("postgres_changes", { event: "*", schema: "public", table: "freelancer_profiles" }, () => loadAllData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadAllData]);

  // ... existing touch handlers ...

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !search.trim() || 
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase()) ||
      job.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ... existing filteredFreelancers logic ...

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getCategoryInfo = (categoryId: string) => categories.find(c => c.id === categoryId) || { name: categoryId, color: "bg-gray-500" };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending_payment': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">💰 Awaiting Payment</Badge>;
      case 'pending_approval': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">⏳ Pending Approval</Badge>;
      case 'approved': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">✅ Approved</Badge>;
      case 'ready_to_start': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">💰 Ready to Start</Badge>;
      case 'open': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">🟢 Open for Bids</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">⏱️ In Progress</Badge>;
      case 'pending_review': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">🔍 Pending Review</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">✅ Completed</Badge>;
      case 'rejected': return <Badge variant="destructive">❌ Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // ✅ FIXED: Bidding availability logic
  const canBid = (job: any) => {
    // Prevent bidding if job is completed or in progress
    if (job.status === "completed" || job.status === "in_progress") return false;
    
    // Prevent bidding if job is expired
    if (new Date(job.expires_at).getTime() <= Date.now()) return false;
    
    // Prevent bidding if user has already submitted a bid
    if (user && myBids.some(b => b.job_id === job.id)) return false;
    
    // Allow bidding for all other cases
    return true;
  };

  // ... existing startChatWithFreelancer function ...

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 rounded-2xl p-6 border border-primary/20 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div><h1 className="font-extrabold text-2xl text-foreground mb-1">Job Offers</h1><p className="text-sm text-muted-foreground">Peer-to-peer academic assistance</p></div>
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg"><Briefcase className="h-7 w-7 text-white" /></div>
          </div>
          <div className="flex gap-2 mb-4">
            <Button onClick={() => navigate("/jobs/post")} size="sm" className="flex-1 h-10 text-sm font-bold rounded-xl shadow-md bg-gradient-to-r from-primary to-accent"><Plus className="h-4 w-4 mr-2" /> Post Job</Button>
            {!isFreelancer && <Button onClick={() => navigate("/jobs/apply")} size="sm" variant="outline" className="flex-1 h-10 text-sm font-bold rounded-xl border-primary/30">Become a Freelancer</Button>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center"><p className="text-xl font-extrabold text-primary">{jobs.length}</p><p className="text-[10px] text-muted-foreground font-medium">Active Jobs</p></div>
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center"><p className="text-xl font-extrabold text-secondary">{myJobs.length}</p><p className="text-[10px] text-muted-foreground font-medium">My Requests</p></div>
            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center"><p className="text-xl font-extrabold text-[hsl(var(--success))]">{myBids.length}</p><p className="text-[10px] text-muted-foreground font-medium">My Bids</p></div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search jobs, freelancers, or subjects..." className="w-full pl-10 pr-10 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setSelectedCategory("all")} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedCategory === "all" ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border text-muted-foreground hover:bg-muted"}`}>All Categories</button>
          {categories.map((cat) => (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedCategory === cat.id ? "bg-primary text-primary-foreground shadow-md" : "bg-card border border-border text-muted-foreground hover:bg-muted"}`}>{cat.name}</button>))}
        </div>
      </div>

      {/* Horizontal Swipeable Tabs */}
      <div className="px-4 mt-4">
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => {
            startXRef.current = e.pageX;
            scrollLeftRef.current = scrollRef.current?.scrollLeft || 0;
            isDraggingRef.current = true;
          }}
          onMouseMove={(e) => {
            if (!isDraggingRef.current || !scrollRef.current) return;
            e.preventDefault();
            const x = e.pageX;
            const walk = (x - startXRef.current) * 1.5;
            scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
          }}
          onMouseUp={() => { isDraggingRef.current = false; }}
          onMouseLeave={() => { isDraggingRef.current = false; }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all select-none ${
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4">
        {activeTab === "browse" && (
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border"><Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm font-bold text-muted-foreground">No active job offers found</p></div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const catInfo = getCategoryInfo(job.category);
                  const timeRemaining = getTimeRemaining(job.expires_at);
                  const isUrgent = timeRemaining.includes("h") && parseInt(timeRemaining) < 2;
                  const canUserBid = canBid(job);
                  
                  return (
                    <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group overflow-hidden relative">
                      {isUrgent && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-bl-full -z-10 opacity-20" />}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`${catInfo.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-full`}>{catInfo.name}</Badge>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full"><Timer className="h-3 w-3" />{timeRemaining} left</div>
                      </div>
                      <h3 className="font-bold text-base mb-2 line-clamp-1 group-hover:text-primary transition-colors">{job.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center text-xs font-bold">{job.client?.first_name?.[0]}{job.client?.last_name?.[0]}</div>
                          <div><p className="text-xs font-medium text-foreground">{job.client?.first_name} {job.client?.last_name}</p><div className="flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />{job.location}</div></div>
                        </div>
                        <div className="text-right"><p className="text-lg font-extrabold text-primary">₱{job.hourly_rate}</p><p className="text-[10px] text-muted-foreground">per hour</p></div>
                      </div>
                      
                      {/* ✅ FIXED: Show bidding availability indicator */}
                      {canUserBid && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Bidding Open</span>
                          <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
                        </div>
                      )}
                      {!canUserBid && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-muted/30 to-transparent" />
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {job.status === "completed" ? "Job Completed" : 
                             job.status === "in_progress" ? "In Progress" : 
                             "Bidding Closed"}
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-l from-muted/30 to-transparent" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "freelancers" && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-4"><Users className="h-4 w-4 text-primary" /> Active Freelancers ({filteredFreelancers.length})</h3>
              {filteredFreelancers.length === 0 ? (
                <div className="text-center py-8"><Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground">No active freelancers found</p></div>
              ) : (
                <div className="space-y-3">
                  {filteredFreelancers.map((freelancer) => (
                    <div key={freelancer.id} className="bg-muted/30 rounded-xl p-4 border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {freelancer.profile?.avatar_url ? <img src={freelancer.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-primary">{freelancer.profile?.first_name?.[0]}{freelancer.profile?.last_name?.[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-sm text-foreground truncate">{freelancer.profile?.first_name} {freelancer.profile?.last_name}</h4>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 gap-1 flex-shrink-0 ml-2" onClick={(e) => { e.stopPropagation(); startChatWithFreelancer(freelancer.user_id); }}><MessageCircle className="h-3 w-3" /> Message</Button>
                          </div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /><span className="text-xs font-bold text-foreground">{freelancer.rating?.toFixed(1) || "0.0"}</span></div>
                            <div className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] text-muted-foreground">{freelancer.completed_sessions || 0} jobs done</span></div>
                          </div>
                          {freelancer.academic_strengths && <p className="text-[10px] text-muted-foreground mb-1 line-clamp-1"><span className="font-bold">Strengths:</span> {freelancer.academic_strengths}</p>}
                          {freelancer.subjects && freelancer.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {freelancer.subjects.slice(0, 3).map((subject, idx) => (<Badge key={idx} variant="secondary" className="text-[9px] px-1.5 py-0.5"><BookOpen className="h-2.5 w-2.5 mr-0.5" /> {subject}</Badge>))}
                              {freelancer.subjects.length > 3 && <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">+{freelancer.subjects.length - 3} more</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "my-activity" && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> My Job Requests</h3>
              {myJobs.length === 0 ? (
                <div className="text-center py-8"><p className="text-xs text-muted-foreground">You haven't posted any jobs yet</p><Button onClick={() => navigate("/jobs/post")} size="sm" className="mt-3 h-8 text-xs"><Plus className="h-3 w-3 mr-1" /> Post Your First Job</Button></div>
              ) : (
                <div className="space-y-2">
                  {myJobs.map((job) => (
                    <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="bg-muted/30 rounded-xl p-3 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{job.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(job.status)}
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
              <>
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> My Bids</h3>
                  {myBids.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No bids submitted yet</p> : (
                    <div className="space-y-2">
                      {myBids.map(bid => (
                        <div key={bid.id} onClick={() => navigate(`/jobs/${bid.job_id}`)} className="bg-muted/30 rounded-xl p-3 active:scale-[0.98] transition-all cursor-pointer">
                          <div className="flex justify-between items-start mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{bid.job?.title || "Job"}</p>
                              <p className="text-[10px] text-muted-foreground">₱{bid.proposed_price} · {bid.status}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${bid.status === 'accepted' ? 'bg-green-100 text-green-600' : bid.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>{bid.status.toUpperCase()}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{bid.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> My Sessions</h3>
                  {mySessions.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">No sessions yet</p> : (
                    <div className="space-y-2">
                      {mySessions.map(session => (
                        <div key={session.id} onClick={() => navigate(`/jobs/${session.job_id}`)} className="bg-muted/30 rounded-xl p-3 active:scale-[0.98] transition-all cursor-pointer">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-bold">{session.job?.title || "Session"}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              session.status === 'completed' ? 'bg-green-100 text-green-600' :
                              session.status === 'active' ? 'bg-blue-100 text-blue-600' :
                              session.status === 'pending_review' ? 'bg-purple-100 text-purple-600' :
                              session.status === 'scheduled' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-muted text-muted-foreground'
                            }`}>{session.status.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          {session.duration_minutes && <p className="text-[10px] text-muted-foreground">Duration: {session.duration_minutes} minutes</p>}
                          {session.start_time && <p className="text-[10px] text-muted-foreground">Started: {new Date(session.start_time).toLocaleDateString()}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="px-4 mt-6 mb-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0"><AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
            <div><h4 className="font-bold text-xs text-amber-800 dark:text-amber-300 mb-1">Academic Integrity Policy</h4><p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">Freelancers are here to <strong>guide and tutor</strong> you. They are strictly prohibited from completing assignments, projects, or graded work on your behalf.</p></div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}