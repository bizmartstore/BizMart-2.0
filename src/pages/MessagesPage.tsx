import { useState, useEffect, useRef, forwardRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, ArrowLeft, Send, Store, Shield, Check, CheckCheck, User, Search } from "lucide-react";

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

    // Fetch profiles for other participants
    const otherIds = (convos || []).map((c: any) => c.participant_1 === user.id ? c.participant_2 : c.participant_1);
    if (otherIds.length > 0) {
      const { data: profs } = await (supabase as any).from("profiles").select("*").in("user_id", otherIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);

      const { data: sellerData } = await (supabase as any).from("seller_profiles").select("*").in("user_id", otherIds);
      const sellerMap: Record<string, any> = {};
      (sellerData || []).forEach((s: any) => { sellerMap[s.user_id] = s; });
      setSellerProfiles(sellerMap);

      const { data: roleData } = await (supabase as any).from("user_roles").select("role").in("user_id", otherIds);
      setAdminIds((roleData || []).map((r: any) => r.user_id));
    }
  };

  useEffect(() => { load(); }, [user]);

  const getOtherId = (conv: any) => conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1;

  return (
    <div className="space-y-1">
      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-6">No conversations yet</p>
          <p className="text-[10px] text-muted-foreground mb-6">Start a chat with a seller or admin</p>
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
                {isAdmin ? <Shield className="h-5 w-5 text-primary" /> : seller ? <Store className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground truncate">{name}</span>
                  {badge && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${isAdmin ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground"}`}>{badge}</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{conv.last_message || "No messages yet"}</p>
              </div>
              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ""}
              </span>
            </button>
          );
        })
      )    </div>
  );}

/* ─── Chat View ─── */
function ChatView({ conversation, onBack }: { conversation: any; onBack: () => void }) {  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const load = async () => {    const { data } = await (supabase as any)
      .from("messages")
      .select("*")      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(data || []);

    // Mark as read
    if (user) {
      await (supabase as any)
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversation.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);    }
  };
  useEffect(() => { load(); }, [conversation.id]);

  useEffect(() => {
    const channel = supabase.channel(`chat-${conversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` }, (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
        // Mark incoming as read
        if (user && payload.new.sender_id !== user.id) {
          (supabase as any).from("messages").update({ is_read: true }).eq("id", payload.new.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversation.id, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !user) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    await (supabase as any).from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
    });
    await (supabase as any).from("conversations").update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq("id", conversation.id);

    // Send push notification to the other participant    const recipientId = conversation.participant_1 === user.id ? conversation.participant_2 : conversation.participant_1;
    const { notifyNewMessage } = await import("@/lib/notifications");
    const senderName = profile ? `${profile.first_name} ${profile.last_name}` : "Someone";
    notifyNewMessage(recipientId, senderName, content);

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };
  return (
    <div className="flex flex-col h-[calc(100vh-128px)]">
      {/* Header */}      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card">
        <button onClick={onBack} className="p-1"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          {conversation.otherBadge === "Admin" ? <Shield className="h-4 w-4 text-primary" /> : conversation.otherBadge === "Seller" ? <Store className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-foreground">{conversation.otherName}</span>
            {conversation.otherBadge && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full ${conversation.otherBadge === "Admin" ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground"}">{conversation.otherBadge}</span>
            </div>
          </div>
        </div>
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {messages.map((msg) => {            const isMine = msg.sender_id === user?.id;
            return (              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                  <p className="text-[13px] leading-relaxed break-words">{msg.content}</p>
                  <div className={`flex items-center gap-1 ${isMine ? "justify-end" : ""}`}>
                    <span className={`text-[9px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>                    {isMine && (
                      msg.is_read
                        ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                        : <Check className="h-3 w-3 text-primary-foreground/40" />
                    )}
                  </div>
                </div>              </div>
            );          })}
        </div>

        {/* Input */}        <div className="px-3 py-2 border-t border-border bg-card flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 text-sm rounded-full"
          />
          <Button onClick={send} disabled={!input.trim() || sending} size="sm" className="rounded-full h-9 w-9 p-0">            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>  );
}