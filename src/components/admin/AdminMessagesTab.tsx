import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, Send, User, Search, Check, CheckCheck, User, Search, Check, CheckCheck } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: convos } = await (supabase as any).from("conversations").select("*").or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).order("last_message_at", { ascending: false });
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

  useEffect(() => { load(); }, [load]);

  const loadMessages = async (convId: string) => {
    const { data } = await (supabase as any).from("messages").select("*").eq("conversation_id", convId).order("created_at", { ascending: true }).limit(100);
    setMessages(data || []);
    if (user) {
      await (supabase as any).from("messages").update({ is_read: true })
        .eq("conversation_id", convId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      }
    }
  
  useEffect(() => {
    if (!activeConv) return;
    loadMessages(activeConv.id);
    const channel = supabase.channel(`admin-chat-${activeConv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConv.id}` }, (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
        // Mark incoming as read
        if (user && payload.new.sender_id !== user.id) {
          (supabase as any).from("messages").update({ is_read: true }).eq("id", payload.new.id);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    await (supabase as any).from("messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content,
    });
    await (supabase as any).from("conversations").update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq("id", activeConv.id);

    // Send push notification to the other participant
    const recipientId = activeConv.participant_1 === user.id ? activeConv.participant_2 : activeConv.participant_2;
    const { notifyNewMessage } = await import("@/lib/notifications");
    const senderName = profile ? `${profile.first_name} ${profile.last_name}` : "Someone";
    notifyNewMessage(recipientId, senderName, content);

    setSending(false);
  };

  const handleNotifClick = async (n: any) => {
    setOpen(false);
    if (!n.is_read) {
      await (supabase as any).from("messages").update({ is_read: true }).eq("id", n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveConv(null)} className="p-1"><ArrowLeft className="h-5 w-5 text-secondary-foreground" /></button>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground truncate">{activeConv?.otherName || "Chat"}</span>
              {activeConv?.otherBadge && (
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeConv?.otherBadge === "Admin" ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground"
                }`}>{activeConv?.otherBadge}</span>
              </div>
            </div>
            <span className="text-[9px] text-muted-foreground flex-shrink-0">
              {activeConv?.last_message_at ? new Date(activeConv.last_message_at).toLocaleDateString() : ""
            }
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowNewChat(!showNewChat)} className="text-xs h-8">
            {showNewChat ? "Back to Chats" : "New Chat"}
          </Button>
        </div>
      </div>

      {showNewChat ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="pl-8 text-xs h-8 rounded-xl"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {allProfiles.filter(p => 
              !search || 
              `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
              p.email.toLowerCase().includes(search.toLowerCase()) ||
              (p.section || "").toLowerCase().includes(search.toLowerCase())
            ).map(p => (
              <button key={p.user_id} onClick={() => startChat(p.user_id)} className="w-full text-left p-2 hover:bg-muted rounded-lg text-xs border border-border">
                {p.first_name} {p.last_name}
                <p className="text-[10px] text-muted-foreground">{p.email}</p>
                <p className="text-[9px] text-muted-foreground">{p.grade_level} • {p.section}</p>
              </button>
            ))}
            {filteredCustomers.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No students found</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(conv => (
            <div key={conv.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold truncate">{conv.otherName}</span>
                  <span className="text-[10px] text-muted-foreground">#{conv.id.slice(0, 8)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  conv.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'`
                }">{conv.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Last: {new Date(conv.last_message_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveConv(conv)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      </div>
      
      {activeConv && (
        <div className="flex flex-col">
          <div className="flex flex-col mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{activeConv.otherName}</span>
                <span className="text-[10px] text-muted-foreground">({activeConv.otherBadge || " — "})</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{activeConv.last_message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm rounded-lg"
              />
              <Button onClick={sendMessage} disabled={!input.trim() || sending} className="rounded-lg">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {activeConv && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{activeConv.otherName}</span>
              <span className="text-[10px] text-muted-foreground">({activeConv.otherBadge || " — "})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Last: {new Date(activeConv.last_message_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground truncate">{activeConv.last_message}</p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">Last updated:</span>
            <span className="text-[10px] font-bold text-primary">{new Date(activeConv.last_message_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}
      
      {conversations.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No conversations yet</p>}
    </div>
  );
}