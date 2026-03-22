import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, ArrowLeft, User, Search, Check, CheckCheck, RefreshCw } from "lucide-react";
import { notifyNewMessage } from "@/lib/notifications";

export default function AdminMessagesTab() {
  const { user, profile } = useAuth(); // ✅ Get profile
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: convos } = await (supabase as any)
      .from("conversations").select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    setConversations(convos || []);

    const otherIds = (convos || []).map((c: any) =>
      c.participant_1 === user.id ? c.participant_2 : c.participant_1
    );
    if (otherIds.length > 0) {
      const { data: profs } = await (supabase as any).from("profiles").select("*").in("user_id", otherIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, [user]);

  const loadAllProfiles = async () => {
    const { data } = await (supabase as any).from("profiles").select("*").order("first_name");
    setAllProfiles((data || []).filter((p: any) => p.user_id !== user?.id));
  };

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = async (convId: string) => {
    const { data } = await (supabase as any).from("messages").select("*")
      .eq("conversation_id", convId).order("created_at", { ascending: true }).limit(200);
    setMessages(data || []);
    if (user) {
      await (supabase as any).from("messages").update({ is_read: true })
        .eq("conversation_id", convId).neq("sender_id", user.id).eq("is_read", false);
    }
  };

  useEffect(() => {
    if (!activeConv) return;
    loadMessages(activeConv.id);
    const ch = supabase.channel(`admin-chat-${activeConv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${activeConv.id}` }, (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeConv?.id, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !activeConv) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    await (supabase as any).from("messages").insert({
      conversation_id: activeConv.id, sender_id: user.id, content,
    });
    await (supabase as any).from("conversations").update({
      last_message: content, last_message_at: new Date().toISOString(),
    }).eq("id", activeConv.id);
    
    const recipientId = activeConv.participant_1 === user.id ? activeConv.participant_2 : activeConv.participant_1;
    notifyNewMessage(recipientId, profile ? `${profile.first_name} ${profile.last_name}` : "Admin", content);
    setSending(false);
  };

  const startChat = async (otherUserId: string) => {
    if (!user) return;
    const { data: existing } = await (supabase as any).from("conversations").select("*")
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
      .maybeSingle();
    if (existing) {
      setActiveConv(existing);
      setShowNewChat(false);
      return;
    }
    const { data: newConv } = await (supabase as any).from("conversations")
      .insert({ participant_1: user.id, participant_2: otherUserId }).select().single();
    if (newConv) {
      setActiveConv(newConv);
      setShowNewChat(false);
      loadConversations();
    }
  };

  if (activeConv) {
    const otherId = activeConv.participant_1 === user?.id ? activeConv.participant_2 : activeConv.participant_1;
    const otherProf = profiles[otherId];
    const otherName = otherProf ? `${otherProf.first_name} ${otherProf.last_name}` : "User";

    return (
      <div className="space-y-0">
        <div className="flex items-center gap-3 py-2 border-b border-border">
          <button onClick={() => setActiveConv(null)} className="p-1"><ArrowLeft className="h-4 w-4" /></button>
          <span className="font-bold text-sm">{otherName}</span>
        </div>
        <div ref={scrollRef} className="h-80 overflow-y-auto py-3 space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                <p className="text-[13px] break-words">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 text-sm" />
          <Button onClick={sendMessage} disabled={!input.trim() || sending} size="sm"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">💬 Messages</p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={loadConversations} disabled={loading}><RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /></Button>
          <Button size="sm" onClick={() => { setShowNewChat(true); loadAllProfiles(); }} className="text-xs h-7">New Chat</Button>
        </div>
      </div>

      {showNewChat ? (
        <div className="space-y-2">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="text-xs h-8" />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {allProfiles.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())).map(p => (
              <button key={p.user_id} onClick={() => startChat(p.user_id)} className="w-full text-left p-2 hover:bg-muted rounded-lg text-xs border border-border">
                {p.first_name} {p.last_name} ({p.email})
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowNewChat(false)} className="w-full text-xs">Cancel</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => {
            const otherId = conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1;
            const prof = profiles[otherId];
            return (
              <button key={conv.id} onClick={() => setActiveConv(conv)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border bg-card">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-primary" /></div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="font-bold text-xs">{prof ? `${prof.first_name} ${prof.last_name}` : 'User'}</span>
                  <p className="text-[10px] text-muted-foreground truncate">{conv.last_message || "Start chatting..."}</p>
                </div>
              </button>
            );
          })}
          {conversations.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No conversations yet</p>}
        </div>
      )}
    </div>
  );
}