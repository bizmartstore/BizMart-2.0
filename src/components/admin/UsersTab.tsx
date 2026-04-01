import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Shield, Crown, User, RefreshCw } from "lucide-react";

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await (supabase as any).from("profiles").select("*").order("first_name");
    const { data: roles } = await (supabase as any).from("user_roles").select("*");
    const roleMap: Record<string, string> = {};
    (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
    
    const enriched = (profiles || []).map((p: any) => ({
      ...p,
      role: roleMap[p.user_id] || "customer",
    }));
    setUsers(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignRole = async (userId: string, role: string) => {
    try {
      // Delete existing role first
      await (supabase as any).from("user_roles").delete().eq("user_id", userId);
      if (role !== "customer") {
        await (supabase as any).from("user_roles").insert({ user_id: userId, role });
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
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(u => (
          <div key={u.user_id} className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
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
            <Select value={u.role} onValueChange={(v) => assignRole(u.user_id, v)}>
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
        {filtered.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No users found</p>}
      </div>
    </div>
  );
}