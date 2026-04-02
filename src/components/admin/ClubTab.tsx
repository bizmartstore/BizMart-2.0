import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Crown, Star, Loader2 } from "lucide-react";

export default function ClubTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: memberships, error: memError } = await (supabase as any)
        .from("club_memberships")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (memError) throw memError;

      const userIds = (memberships || []).map((m: any) => m.user_id).filter(Boolean);
      let profileMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles, error: profError } = await (supabase as any)
          .from("profiles")
          .select("user_id, first_name, last_name, email, school, grade_level, section")
          .in("user_id", userIds);
        
        if (profError) {
          console.warn("Failed to fetch profiles:", profError);
        } else {
          profileMap = {};
          (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
        }
      }

      const enriched = (memberships || []).map((m: any) => ({
        ...m,
        profiles: profileMap[m.user_id] || null,
      }));

      setMembers(enriched);
    } catch (e: any) {
      console.error("Failed to load club members:", e);
      toast.error("Failed to load club members: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    load();
    
    const channel = supabase
      .channel("admin-club-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "club_memberships" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const updateMembership = async (id: string, status: string) => {
    try {
      await (supabase as any).from("club_memberships").update({ status }).eq("id", id);
      toast.success(`Membership ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update membership");
    }
  };

  const filtered = members.filter(m => 
    !search || 
    (m.profiles?.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.profiles?.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.profiles?.email || "").toLowerCase().includes(search.toLowerCase()) ||
    m.control_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-9 text-xs h-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map(m => (
            <div key={m.id} className="bg-card rounded-xl border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    {m.membership_type === "premium" ? <Star className="h-4 w-4 text-warning" /> : <Crown className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs">
                      {m.profiles ? `${m.profiles.first_name} ${m.profiles.last_name}` : 'Unknown User'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{m.profiles?.email || 'No email'}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  m.status === 'active' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'
                }`}>{m.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-[10px] font-bold block">{m.control_number}</span>
                  <span className="text-[8px] text-muted-foreground">Control #</span>
                </div>
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-[10px] font-bold block">{m.membership_type}</span>
                  <span className="text-[8px] text-muted-foreground">Type</span>
                </div>
                <div className="bg-muted rounded-lg p-1.5">
                  <span className="text-[10px] font-bold block">{new Date(m.expiry_date).toLocaleDateString()}</span>
                  <span className="text-[8px] text-muted-foreground">Expires</span>
                </div>
              </div>
              <div className="flex gap-2">
                {m.status !== "active" && (
                  <Button size="sm" onClick={() => updateMembership(m.id, "active")} className="flex-1 text-[10px]">Activate</Button>
                )}
                {m.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => updateMembership(m.id, "expired")} className="flex-1 text-[10px]">Expire</Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No club members found</p>}
        </div>
      )}
    </div>
  );
}