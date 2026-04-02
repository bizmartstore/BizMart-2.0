// ... (keep existing imports)
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const loadAllProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("first_name");
    setAllProfiles((data || []).filter((p: any) => p.id !== user?.id)); // Use p.id, not p.user_id
  };

// ... (rest of component)