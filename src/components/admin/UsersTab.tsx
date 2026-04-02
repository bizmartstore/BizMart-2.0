import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Shield, Crown, User, RefreshCw, AlertCircle } from "lucide-react";

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      // Fetch profiles directly - they are already linked by id to auth.users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("first_name");
      
      if (profilesError) throw profilesError;
      
      // Fetch roles separately
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");
      
      if (rolesError) throw rolesError;
      
      const roleMap: Record<string, string> = {};
      (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
      
      const enriched = (profiles || []).map((p: any) => ({
        ...p,
        role: roleMap[p.id] || "customer", // Use p.id, not p.user_id
      }));
      setUsers(enriched);
    } catch (e: any) {
      console.error("Failed to load users:", e);
      setDbError(e.message || "Unknown database error");
      toast.error("Failed to load users. Check console for details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignRole = async (userId: string, role: string) => {
    try {
      // Delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      if (role !== "customer") {
        await supabase.from("user_roles").insert({ user_id: userId, role });
      }
      toast.success(`Role updated to ${role}`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update role");
    }
  };

  const filtered = users.filter(u => 
    !search || 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.section || "").toLowerCase().includes(search.toLowerCase())
  );

  const roleIcon = (role: string) => {
    if (role === "main_admin") return <Crown className="h-3 w-3 text-destructive" />;
    if (role === "member_admin") return <Shield className="h-3 w-3 text-primary" />;
    return <User className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9 text-xs h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {dbError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-destructive">Database Error</p>
            <p className="text-[10px] text-destructive/80 mt-0.5">{dbError}</p>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(u => (
          <div key={u.id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : <User className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs truncate">{u.first_name} {u.last_name}</span>
                {roleIcon(u.role)}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
              <p className="text-[9px] text-muted-foreground">{u.school} • {u.grade_level} - {u.section}</p>
            </div>
            <Select value={u.role} onValueChange={(v) => assignRole(u.id, v)}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="member_admin">Member Admin</SelectItem>
                <SelectItem value="main_admin">Main Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-8">
            <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs font-bold text-muted-foreground">No users found</p>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-xs mx-auto">
              If you created accounts but they don't appear here, the Supabase <code className="bg-muted px-1 rounded">handle_new_user</code> trigger might be missing or disabled. 
              This trigger automatically creates a <code className="bg-muted px-1 rounded">profiles</code> row when a user signs up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}