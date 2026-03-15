import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, ArrowLeft, User, Search, Check, CheckCheck } from "lucide-react";
import { notifyNewMessage } from "@/lib/notifications";

export default function AdminMessagesTab() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    if (!user) return;
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
  };

  const loadAllProfiles = async () => {
    const { data } = await (supabase as any).from("profiles").select("*").order("first_name");
    setAllProfiles((data || []).filter((p: any) => p.user_id !== user?.id));
  };

  useEffect(() => { loadConversations(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("admin-conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

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
        if (user && payload.new.sender_id !== user.id) {
          (supabase as any).from("messages").update({ is_read: true }).eq("id", payload.new.id);
        }
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
    const senderName = profile ? `${profile.first_name} ${profile.last_name}` : "Admin";
    notifyNewMessage(recipientId, senderName, content);
    setSending(false);
  };

  const startChat = async (otherUserId: string) => {
    if (!user) return;
    const { data: existing } = await (supabase as any).from("conversations").select("*")
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
      .maybeSingle();
    if (existing) {
      const otherId = existing.participant_1 === user.id ? existing.participant_2 : existing.participant_1;
      setActiveConv({ ...existing, otherId });
      setShowNewChat(false);
      return;
    }
    const { data: newConv } = await (supabase as any).from("conversations")
      .insert({ participant_1: user.id, participant_2: otherUserId }).select().single();
    if (newConv) {
      setActiveConv({ ...newConv, otherId: otherUserId });
      setShowNewChat(false);
      loadConversations();
    }
  };

  // Chat view
  if (activeConv) {
    const otherId = activeConv.participant_1 === user?.id ? activeConv.participant_2 : activeConv.participant_1;
    const otherProf = profiles[otherId];
    const otherName = otherProf ? `${otherProf.first_name} ${otherProf.last_name}` : "User";

    return (
      <div className="space-y-0">
        <div className="flex items-center gap-3 py-2 border-b border-border">
          <button onClick={() => setActiveConv(null)} className="p-1"><ArrowLeft className="h-4 w-4" /></button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm">{otherName}</span>
        </div>
        <div ref={scrollRef} className="h-80 overflow-y-auto py-3 space-y-2">
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  <p className="text-[13px] break-words">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : ""}`}>
                    <span className={`text-[9px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMine && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" /> : <Check className="h-3 w-3 text-primary-foreground/40" />)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message..." className="flex-1 text-sm rounded-full" />
          <Button onClick={sendMessage} disabled={!input.trim() || sending} size="sm" className="rounded-full h-9 w-9 p-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // New chat view
  if (showNewChat) {
    if (allProfiles.length === 0) loadAllProfiles();
    const filtered = allProfiles.filter(p =>
      !search || `${p.first_name} ${p.last_name} ${p.email} ${p.section || ""}`.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewChat(false)} className="p-1"><ArrowLeft className="h-4 w-4" /></button>
          <span className="font-bold text-sm">New Message</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, section..." className="pl-8 text-xs h-8 rounded-xl" />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-0.5">
          {filtered.slice(0, 50).map(p => (
            <button key={p.user_id} onClick={() => startChat(p.user_id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover rounded-full" /> : <User className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="text-left min-w-0 flex-1">
                <span className="font-bold text-xs">{p.first_name} {p.last_name}</span>
                <p className="text-[10px] text-muted-foreground truncate">{p.email} • {p.grade_level} {p.section}</p>
              </div>
              <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">💬 Messages ({conversations.length})</p>
        <Button size="sm" onClick={() => setShowNewChat(true)} className="text-xs h-7 gap-1">
          <MessageCircle className="h-3 w-3" /> New Chat
        </Button>
      </div>
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No conversations yet</p>
        </div>
      ) : conversations.map(conv => {
        const otherId = conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1;
        const prof = profiles[otherId];
        const name = prof ? `${prof.first_name} ${prof.last_name}` : "User";
        return (
          <button key={conv.id} onClick={() => setActiveConv({ ...conv, otherId })}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border bg-card">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="font-bold text-xs text-foreground">{name}</span>
              <p className="text-[10px] text-muted-foreground truncate">{conv.last_message || "Start chatting..."}</p>
            </div>
            <span className="text-[9px] text-muted-foreground flex-shrink-0">
              {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
