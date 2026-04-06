"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ArrowLeft, Send, Loader2, User, ShieldCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function EKausapPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [requestForm, setRequestForm] = useState({
    concernType: "",
    urgency: "normal",
    message: "",
  });

  // Load active session
  useEffect(() => {
    if (!user) return;
    const loadSession = async () => {
      const { data } = await (supabase as any)
        .from("support_chat_sessions")
        .select("*")
        .eq("student_id", user.id)
        .in("status", ["requested", "active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setSession(data);
        loadMessages(data.id);
      }
    };
    loadSession();
  }, [user]);

  const loadMessages = async (sid: string) => {
    const { data } = await (supabase as any)
      .from("support_messages")
      .select("*")
      .eq("session_id", sid)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  // Real-time messages
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel(`support-chat-${session.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `session_id=eq.${session.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleRequest = async () => {
    if (!requestForm.concernType) {
      toast.error("Please select a concern type.");
      return;
    }
    setRequesting(true);
    try {
      const { data, error } = await (supabase as any).from("support_chat_sessions").insert({
        student_id: user?.id,
        concern_type: requestForm.concernType,
        urgency: requestForm.urgency,
        status: 'requested',
        is_anonymous: false
      }).select().single();

      if (error) throw error;
      
      // Initial message
      if (requestForm.message) {
        await (supabase as any).from("support_messages").insert({
          session_id: data.id,
          sender_id: user?.id,
          content: requestForm.message
        });
      }

      setSession(data);
      toast.success("Chat request sent! A counselor will be with you shortly.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRequesting(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !session) return;
    const content = input.trim();
    setInput("");
    await (supabase as any).from("support_messages").insert({
      session_id: session.id,
      sender_id: user?.id,
      content
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Login Required</h2>
        <p className="text-sm text-muted-foreground mb-6">Please login to talk to a guidance counselor.</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-extrabold text-lg">Request a Conversation</h1>
        </div>
        <div className="px-4 py-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-5 border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase">Safe & Confidential</span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Fill out this form to start a private chat with an authorized guidance counselor. We are here to listen.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">What's on your mind? *</Label>
              <Select onValueChange={(v) => setRequestForm({...requestForm, concernType: v})}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select concern type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mental Health">Mental Health / Stress</SelectItem>
                  <SelectItem value="Academic">Academic Pressure</SelectItem>
                  <SelectItem value="Personal">Personal / Family Issues</SelectItem>
                  <SelectItem value="Peer">Peer Relationships</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Urgency Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {["low", "normal", "urgent"].map(u => (
                  <button
                    key={u}
                    onClick={() => setRequestForm({...requestForm, urgency: u})}
                    className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                      requestForm.urgency === u 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-card text-muted-foreground border-border'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Initial Message (Optional)</Label>
              <Input 
                placeholder="Briefly describe what you want to talk about..." 
                className="h-11 rounded-xl"
                value={requestForm.message}
                onChange={(e) => setRequestForm({...requestForm, message: e.target.value})}
              />
            </div>

            <Button onClick={handleRequest} disabled={requesting} className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
              {requesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Request Conversation
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/e-support")} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Guidance Counselor</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`h-1.5 w-1.5 rounded-full ${session.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-[9px] text-muted-foreground uppercase font-bold">
                  {session.status === 'active' ? 'Online' : 'Waiting for response'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-[10px] font-bold text-red-600">End Session</Button>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.status === 'requested' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-2xl p-4 text-center">
            <Clock className="h-5 w-5 text-amber-600 mx-auto mb-2" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
              Your request is in queue. A counselor will join the chat shortly. Estimated wait: 5-10 mins.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                isMine 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-muted text-foreground rounded-bl-none'
              }`}>
                <p className="leading-relaxed">{msg.content}</p>
                <span className={`text-[8px] mt-1 block ${isMine ? 'text-blue-100' : 'text-muted-foreground'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Type your message..." 
            className="rounded-full h-11 bg-muted/50 border-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} disabled={!input.trim()} size="icon" className="rounded-full h-11 w-11 bg-blue-600 hover:bg-blue-700 flex-shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}