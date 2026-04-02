import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, RefreshCw, User, Star, Loader2, Search, Award } from "lucide-react";

export default function FreelancersTab() {
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all freelancer applications with user profiles
      const { data: apps, error } = await (supabase as any)
        .from("freelancer_profiles")
        .select(`
          *,
          profiles:user_id (
            user_id,
            first_name,
            last_name,
            email,
            school,
            grade_level,
            section
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setApplications(apps || []);
    } catch (e: any) {
      console.error("Failed to load freelancer applications:", e);
      toast.error("Failed to load applications: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const { error } = await (supabase as any)
        .from("freelancer_profiles")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success(`Application ${status}!`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update application");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = applications.filter(app => {
    const matchFilter = filter === "all" || app.status === filter;
    const matchSearch = !search || 
      `${app.profiles?.first_name || ''} ${app.profiles?.last_name || ''}`.toLowerCase().includes(search.toLowerCase()) ||
      (app.profiles?.email || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Object.entries(statusCounts).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-9 text-xs h-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(app => (
            <div key={app.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-xs">
                      {app.profiles ? `${app.profiles.first_name} ${app.profiles.last_name}` : 'Unknown User'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{app.profiles?.email || 'No email'}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {app.profiles?.school} • {app.profiles?.grade_level} - {app.profiles?.section}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  app.status === 'approved' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                  app.status === 'pending' ? 'bg-warning/20 text-warning' :
                  'bg-destructive/20 text-destructive'
                }`}>
                  {app.status.toUpperCase()}
                </span>
              </div>
              
              {app.academic_strengths && (
                <p className="text-[10px] text-muted-foreground mb-1">
                  <span className="font-bold">Strengths:</span> {app.academic_strengths}
                </p>
              )}
              {app.subjects && app.subjects.length > 0 && (
                <p className="text-[10px] text-muted-foreground mb-1">
                  <span className="font-bold">Subjects:</span> {app.subjects.join(', ')}
                </p>
              )}
              {app.experience && (
                <p className="text-[10px] text-muted-foreground mb-1">
                  <span className="font-bold">Experience:</span> {app.experience}
                </p>
              )}
              {app.bio && (
                <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">
                  <span className="font-bold">Bio:</span> {app.bio}
                </p>
              )}
              
              <div className="flex gap-2">
                {app.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(app.id, "approved")}
                      disabled={updating === app.id}
                      className="gap-1 flex-1"
                    >
                      {updating === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus(app.id, "rejected")}
                      disabled={updating === app.id}
                      className="gap-1 flex-1"
                    >
                      {updating === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                      Reject
                    </Button>
                  </>
                )}
                {app.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(app.id, "pending")}
                    disabled={updating === app.id}
                    className="flex-1"
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8">No freelancer applications found</p>
          )}
        </div>
      )}
    </div>
  );
}