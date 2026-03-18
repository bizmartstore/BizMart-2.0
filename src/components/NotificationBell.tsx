import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";import { toast } from "@/hooks/use-toast";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (error) console.error("NotificationBell load error:", error);
    setNotifications(data || []);

    const lastSeen = localStorage.getItem(`notif_seen_${user.id}`) || "2000-01-01";
    const count = (data || []).filter((n: any) => new Date(n.created_at) > new Date(lastSeen)).length;
    setUnreadCount(count);
  }, [user]);
  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  useEffect(() => {
    const channel = supabase
      .channel(`user-notifications-${user?.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification_logs" }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open && user) {
      localStorage.setItem(`notif_seen_${user.id}`, new Date().toISOString());
      setUnreadCount(0);
    }
  };

  const handleClick = (n: any) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="p-1.5 relative">
        <Bell className="h-5 w-5 text-secondary-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-72 max-h-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-border bg-muted/50">
            <span className="font-bold text-xs">Notifications</span>
          </div>
          <div className="overflow-y-auto max-h-64">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">No notifications</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm flex-shrink-0">{n.icon || "🔔"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-foreground truncate">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-3">{n.message}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}