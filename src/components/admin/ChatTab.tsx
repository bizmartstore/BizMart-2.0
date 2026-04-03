import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { MessageCircle, Store, Shield, User, Search } from "lucide-react";

export default function ChatTab({ onSelect }: { onSelect: (conv: any) => void }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [sellers, setSellers] = useState<Record<string, any>>({});
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!user) return;
    const { data: convos } = await (supabase as any).from("conversations").select("*").or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).order("last_message_at", { ascending: false });
    setConversations(convos || []);

    const otherIds = (convos || []).map((c: any) => c.participant_1 === user.id ? c.participant_2 : c.participant_1);
    if (otherIds.length > 0) {
      const { data: profs } = await (supabase as any).from("profiles").select("*").in("user_id", otherIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);

      const { data: sellers } = await (supabase as any).from("seller_profiles").select("*").in("user_id", otherIds);
      const sMap: Record<string, any> = {};
      (sellers || []).forEach((s: any) => { sMap[s.user_id] = s; });
      setSellers(sMap);

      const { data: roles } = await (supabase as any).from("user_roles").select("role").in("user_id", otherIds);
      setAdminIds((roles || []).map((r: any) => r.user_id));
    }
  };

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    return () => clearInterval(poll);
  }, [user]);

  const filtered = conversations.filter(c => {
    const otherId = c.participant_1 === user?.id ? c.participant_2 : c.participant_1;
    const prof = profiles[otherId];
    const seller = sellers[otherId];
    const name = seller?.store_name || (prof ? `${prof.first_name} ${prof.last_name}` : "User");
    return !search || name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..." className="pl-9 text-xs h-9" />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-12"><MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No conversations yet</p></div>
      ) : (
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {filtered.map((conv) => {
            const otherId = conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1;
            const prof = profiles[otherId];
            const seller = sellers[otherId];
            const isAdmin = adminIds.includes(otherId);
            const name = seller?.store_name || (prof ? `${prof.first_name} ${prof.last_name}` : "User");
            const badge = isAdmin ? "Admin" : seller ? "Seller" : null;

            return (
              <button key={conv.id} onClick={() => onSelect({ ...conv, otherName: name, otherBadge: badge, otherId })} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0">
                  {isAdmin ? <Shield className="h-5 w-5 text-primary" /> : seller ? <Store className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-foreground truncate">{name}</span>
                    {badge && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${isAdmin ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground"}`}>{badge}</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{conv.last_message || "Start chatting..."}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}