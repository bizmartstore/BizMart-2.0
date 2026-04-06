` ... `＜/dyad-write>`
`＜dyad-chat-summary>Fixed TypeScript scope error for channel variable＜/dyad-chat-summary>`
Done. 
Let's generate. 
[Output Generation] -> *Proceeds*</think><dyad-write path="src/pages/MessagesPage.tsx">
import { useState, useEffect, useRef, forwardRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, ArrowLeft, Send, Store, Shield, Check, CheckCheck, User, Search } from "lucide-react";
import { toast } from "sonner";

/* ─── Conversation List ─── */
function ConversationList({ onSelect }: { onSelect: (conv: any) => void }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [sellerProfiles, setSellerProfiles] = useState<Record<string, any>>({});
  const [adminIds, setAdminIds] = useState<string[]>([]);

  const load = async () => {
    if (!user) return;
    const { data: convos } = await (supabase as any)
      .from("conversations")
      .select("*")
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

      const { data: sellers } = await (supabase as any).from("seller_profiles").select("*").in("user_id", otherIds);
      const smap: Record<string, any> = {};
      (sellers || []).forEach((s: any) => { smap[s.user_id] = s; });
      setSellerProfiles(smap);

      const { data: roles } = await (supabase as any).from("user_roles").select("*").in("user_id", otherIds);
      setAdminIds((roles || []).map((r: any) => r.user_id));
    }
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getOtherId = (c: any) => c.participant_1 === user?.id ? c.participant_2 : c.participant_1;

  return (
    <div className="space-y-1">
      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No conversations yet</p>
          <p className="text-[10px] text-muted-foreground mt-1">Start a chat with a seller or admin</p>
        </div>
      ) : (
        conversations.map((conv) => {
          const otherId = getOtherId(conv);
          const prof = profiles[otherId];
          const seller = sellerProfiles[otherId];
          const isAdmin = adminIds.includes(otherId);
          const name = seller?.store_name || (prof ? `${prof.first_name} ${prof.last_name}` : "User");
          const badge = isAdmin ? "Admin" : seller ? "Seller" : null;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect({ ...conv, otherName: name, otherBadge: badge, otherId })}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center flex-shrink-0">
                {isAdmin ? <Shield className="h-5 w-5 text-primary" /> :
                 seller ? <Store className="h-5 w-5 text-primary" /> :
                 <User className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground truncate">{name}</span>
                  {badge && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      isAdmin ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground"
                    }`}>{badge}</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{conv.last_message || "Start chatting..."}</p>
              </div>
              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ""}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

/* ─── Chat View ─── */
function ChatView({ conversation, onBack }: { conversation: any; onBack: () => void }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversation) return;
    
    let isMounted = true;
    let ch: any = null;

    const loadAndSubscribe = async () => {
      // Set up subscription first
      ch = supabase.channel(`chat-${conversation.id}`)
        .on("postgres_changes", { 
          event: "INSERT", 
          schema: "public", 
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}` 
        }, (payload: any) => {
          if (!isMounted) return;
          // Use functional update to avoid stale closure
          setMessages(prev => {
            if (prev.some(msg => msg.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        })
        .subscribe();

      // Load initial messages
      try {
        const { data } = await (supabase as any).from("messages").select("*")
          .eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(200);
        
        if (isMounted) {
          setMessages(data || []);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    };

    loadAndSubscribe();

    return () => {
      isMounted = false;
      if (ch) supabase.removeChannel(ch);
    };
  }, [conversation?.id, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !conversation || sending || cooldown) return;
    
    setSending(true);
    const content = input.trim();
    setInput("");
    
    try {
      const { data, error } = await (supabase as any).from("messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content,
      }).select().single();

      if (error) throw error;

      // Optimistically add the message
      setMessages(prev => {
        if (prev.some(msg => msg.id === data.id)) return prev;
        return [...prev, data];
      });

      await (supabase as any).from("conversations").update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      }).eq("id", conversation.id);
      
      const recipientId = conversation.participant_1 === user.id ? conversation.participant_2 : conversation.participant_1;
      const { notifyNewMessage } = await import("@/lib/notifications");
      const senderName = profile ? `${profile.first_name} ${profile.last_name}` : "Someone";
      notifyNewMessage(recipientId, senderName, content);
      
      // Start cooldown (10 seconds)
      setCooldown(true);
      setTimeout(() => setCooldown(false), 10000);
      
    } catch (e: any) {
      console.error("Failed to send message:", e);
      toast.error("Failed to send message");
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-128px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card">
        <button onClick={onBack} className="p-1"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
          {conversation.otherBadge === "Admin" ? <Shield className="h-4 w-4 text-primary" /> :
           conversation.otherBadge === "Seller" ? <Store className="h-4 w-4 text-primary" /> :
           <User className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-foreground">{conversation.otherName}</span>
            {conversation.otherBadge && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">{conversation.otherBadge}</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                isMine
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <p className="text-[13px] leading-relaxed break-words">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : ""}`}>
                  <span className={`text-[9px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMine && (
                    msg.is_read
                      ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                      : <Check className="h-3 w-3 text-primary-foreground/40" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border bg-card flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 text-sm rounded-full"
          disabled={cooldown}
        />
        <Button 
          onClick={sendMessage} 
          disabled={!input.trim() || sending || cooldown} 
          size="sm" 
          className="rounded-full h-9 w-9 p-0"
        >
          {sending ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      {cooldown && (
        <div className="px-3 py-1 text-center text-[10px] text-muted-foreground bg-muted/30">
          Please wait 10 seconds before sending another message...
        </div>
      )}
    </div>
  );
}

/* ─── New Chat Starter ─── */
const NewChatPanel = forwardRef<HTMLDivElement, { onStartChat: (userId: string) => void }>(function NewChatPanel({ onStartChat }, ref) {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [admins, setAdmins] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadContacts = async () => {
      setLoading(true);
      const { data: roleData } = await (supabase as any).from("user_roles").select("user_id, role");
      const adminRoles = (roleData || []).filter((r: any) => r.user_id !== user.id);
      const adminUserIds = adminRoles.map((r: any) => r.user_id);
      
      if (adminRoles.length > 0) {
        const { data: profs } = await (supabase as any).from("profiles").select("*").in("user_id", adminUserIds);
        const adminList = (profs || []).map((p: any) => ({
          ...p,
          role: adminRoles.find((r: any) => r.user_id === p.user_id)?.role,
        })).sort((a: any, b: any) => {
          if (a.role === 'main_admin' && b.role !== 'main_admin') return -1;
          if (a.role !== 'main_admin' && b.role === 'main_admin') return 1;
          return 0;
        });
        setAdmins(adminList);
      }
      
      const { data: sellerData } = await (supabase as any).from("seller_profiles").select("*").eq("is_active", true);
      setSellers((sellerData || []).filter((s: any) => s.user_id !== user?.id));

      if (isAdmin) {
        const { data: allProfiles } = await (supabase as any).from("profiles").select("*").order("first_name");
        const sellerUserIds = (sellerData || []).map((s: any) => s.user_id);
        const allAdminIds = [...adminUserIds, user.id];
        const customerList = (allProfiles || []).filter(
          (p: any) => !allAdminIds.includes(p.user_id) && !sellerUserIds.includes(p.user_id)
        );
        setCustomers(customerList);
      }

      setLoading(false);
    };
    loadContacts();
  }, [user, isAdmin]);

  const filteredCustomers = customers.filter((c) =>
    !customerSearch ||
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.section || "").toLowerCase().includes(customerSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-4">
      <div>
        <p className="font-bold text-xs text-muted-foreground uppercase mb-2">📞 BizMart Support</p>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {admins.length > 0 ? admins.map((a) => (
            <button key={a.user_id} onClick={() => onStartChat(a.user_id)}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                a.role === 'main_admin' 
                  ? 'bg-gradient-to-br from-destructive/20 to-primary/20' 
                  : 'bg-primary/20'
              }`}>
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">{a.first_name} {a.last_name}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                    a.role === 'main_admin' ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'
                  }`}>
                    {a.role === 'main_admin' ? '👑 Main Admin' : '🛡️ Member Admin'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{a.email}</p>
              </div>
              <MessageCircle className="h-4 w-4 text-primary" />
            </button>
          )) : (
            <div className="p-4 text-center">
              <p className="text-xs text-muted-foreground">No admin contacts available yet</p>
            </div>
          )}
        </div>
      </div>

      {sellers.length > 0 && (
        <div>
          <p className="font-bold text-xs text-muted-foreground uppercase mb-2">🏪 Sellers</p>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {sellers.map((s) => (
              <button key={s.user_id} onClick={() => onStartChat(s.user_id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                  {s.store_image ? <img src={s.store_image} alt="" className="w-full h-full object-cover" /> :
                    <Store className="h-5 w-5 text-primary" />}
                </div>
                <div className="text-left flex-1">
                  <span className="font-bold text-xs text-foreground">{s.store_name || "Store"}</span>
                  {s.store_saying && <p className="text-[10px] text-muted-foreground italic">"{s.store_saying}"</p>}
                </div>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {isAdmin && customers.length > 0 && (
        <div>
          <p className="font-bold text-xs text-muted-foreground uppercase mb-2">👥 Customers ({customers.length})</p>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search students by name, email, section..."
              className="pl-8 text-xs h-8 rounded-xl"
            />
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden max-h-72 overflow-y-auto">
            {filteredCustomers.slice(0, 50).map((c) => (
              <button key={c.user_id} onClick={() => onStartChat(c.user_id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-bold text-xs text-foreground">{c.first_name} {c.last_name}</span>
                  <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                  <p className="text-[9px] text-muted-foreground">{c.grade_level} • {c.section}</p>
                </div>
                <MessageCircle className="h-4 w-4 text-primary" />
              </button>
            ))}
            {filteredCustomers.length === 0 && (
              <p className="text-center text-[10px] text-muted-foreground py-4">No students found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/* ─── Main Page ─── */
export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeConv, setActiveConv] = useState<any | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const startChat = async (otherUserId: string) => {
    if (!user) return;
    const { data: existing } = await (supabase as any)
      .from("conversations")
      .select("*")
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      const info = await getConvInfo(existing, user.id);
      setActiveConv({ ...existing, ...info });
      setShowNewChat(false);
      return;
    }

    const { data: newConv } = await (supabase as any)
      .from("conversations")
      .insert({ participant_1: user.id, participant_2: otherUserId })
      .select()
      .single();

    if (newConv) {
      const info = await getConvInfo(newConv, user.id);
      setActiveConv({ ...newConv, ...info });
      setShowNewChat(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Messages</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to start messaging.</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (activeConv) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ChatView conversation={activeConv} onBack={() => setActiveConv(null)} />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="font-extrabold text-lg text-foreground">Messages</h1>
          </div>
          <Button size="sm" onClick={() => setShowNewChat(!showNewChat)} variant={showNewChat ? "outline" : "default"} className="text-xs h-8">
            {showNewChat ? "Back to Chats" : "New Chat"}
          </Button>
        </div>

        {showNewChat ? (
          <NewChatPanel onStartChat={startChat} />
        ) : (
          <ConversationList onSelect={(conv) => setActiveConv(conv)} />
        )}
      </div>
      <BottomNav />
    </div>
  );
}

async function getConvInfo(conv: any, myId: string) {
  const otherId = conv.participant_1 === myId ? conv.participant_2 : conv.participant_1;
  const { data: prof } = await (supabase as any).from("profiles").select("*").eq("user_id", otherId).maybeSingle();
  const { data: seller } = await (supabase as any).from("seller_profiles").select("*").eq("user_id", otherId).maybeSingle();
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", otherId).maybeSingle();

  const isAdmin = !!role;
  const name = seller?.store_name || (prof ? `${prof.first_name} ${prof.last_name}` : "User");
  const badge = isAdmin ? "Admin" : seller ? "Seller" : null;

  return { otherName: name, otherBadge: badge, otherId };
}