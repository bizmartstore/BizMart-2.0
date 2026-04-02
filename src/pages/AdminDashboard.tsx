// ... (keep all existing imports)

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const { isAdmin, isMainAdmin, loading: roleLoading } = useAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // ... (rest of the component stays the same until the header)

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-extrabold text-xl text-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {isMainAdmin ? "👑 Main Admin" : "🛡️ Member Admin"} • {profile?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            
            {/* LOGOUT BUTTON */}
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  toast({ title: "Logged out successfully" });
                  navigate('/login');
                } catch (error: any) {
                  toast({ 
                    title: "Logout failed", 
                    description: error.message, 
                    variant: "destructive" 
                  });
                }
              }}
              className="gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </Button>
          </div>
        </div>

        // ... (rest of the component remains unchanged)