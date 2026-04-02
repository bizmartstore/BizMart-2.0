import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export default function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase.from("notification_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
      setCount(count || 0);
    };
    load();
  }, [user]);

  return (
    <button className="p-1.5 relative">
      <Bell className="h-5 w-5 text-secondary-foreground" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-flash text-flash-foreground text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </button>
  );
}