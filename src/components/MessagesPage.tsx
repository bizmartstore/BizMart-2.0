// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const load = async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    setConversations(convos || []);

    // Fetch profiles for other participants using id (not user_id)
    const otherIds = (convos || []).map((c: any) =>
      c.participant_1 === user.id ? c.participant_2 : c.participant_1
    );
    if (otherIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("*")
        .in("id", otherIds); // Use id
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; }); // Use p.id
      setProfiles(map);

      const { data: sellers } = await supabase
        .from("seller_profiles")
        .select("*")
        .in("user_id", otherIds);
      const smap: Record<string, any> = {};
      (sellers || []).forEach((s: any) => { smap[s.user_id] = s; });
      setSellerProfiles(smap);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("*")
        .in("user_id", otherIds);
      setAdminIds((roles || []).map((r: any) => r.user_id));
    }
  };

// ... (rest of component)