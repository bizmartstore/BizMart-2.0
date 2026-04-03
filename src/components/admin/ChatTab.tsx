import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Search, Send, Store, Shield, Check, CheckCheck, User, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ChatTab({ onSelect }: { onSelect: (conv: any) => void }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [sellers, setSellers] = useState<Record<string, any>>({});
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0); // New state for unread count

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
      const sMap: Record<string, any> = {};
      (sellers || []).forEach((s: any) => { sMap[s.user_id] = s; });
      setSellers(sMap);

      const { data: roles } = await (supabase as any).from("user_roles").select("role").in("user_id", otherIds);
      setAdminIds((roles || []).map((r: any) => r.user_id));
    }

    // Count unread messages
    const unread = await (supabase as any).from("messages")
      .select("id")
      .eq("conversation_id", "any") // placeholder, will be replaced per conversation
      .eq("is_read", false)
      .neq("sender_id", user.id)
      .then((res) => res.data?.length || 0);
    // We'll update this count per conversation later

    // For now, just set a generic unread count based on total unread messages
    const { data: msgRes } = await (supabase as any).from("messages")
      .select("id")
      .eq("is_read", false)
      .neq("sender_id", user.id)
      .limit(10);
    setUnreadCount(msgRes?.length || 0);
  };

  useEffect(() => { load(); }, [user]);

  // Poll every 5 seconds to refresh unread count
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const { data: msgRes } = await (supabase as any).from("messages")
          .select("id")
          .eq("is_read", false)
          .neq("sender_id", user.id)
          .limit(10);
        setUnreadCount(msgRes?.length || 0);
      } catch (e) {
        console.warn("Failed to poll unread messages:", e);
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [user]);

  // ... rest of component unchanged