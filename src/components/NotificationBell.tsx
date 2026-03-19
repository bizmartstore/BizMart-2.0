import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("notification_logs")
      .select("*")
      .or(`user_id.eq.${user.id},target_role.eq.admin`)
      .order("created_at", { ascending: false })
      .limit(20);
    
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
  }, [user]);

  useEffect(() => {
    loadNotifications();
    // Real-time subscription
    const channel = supabase.channel("notif-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification_logs" }, () => loadNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadNotifications]);

  const markAllAsRead = async () => {
    if (!user) return;
    await (supabase as any).from("notification_logs").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    loadNotifications();
  };

  const handleNotifClick = async (n: any) => {
    setOpen(false);
    if (!n.is_read) {
      await (supabase as any).from("notification_logs").update({ is_read: true }).eq("id", n.id);
      loadNotifications();
    }
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1.5 relative">
        <Bell className="h-5 w-5 text-secondary-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-[400px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
            <span className="font-bold text-xs">Notifications</span>
            <button onClick={markAllAsRead} className="text-[10px] text-primary font-bold hover:underline">Mark all read</button>
          </div>
          <div className="overflow-y-auto max-h-[340px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors flex gap-3 ${n.is_read ? 'opacity-60' : 'bg-primary/5'}`}
                >
                  <span className="text-xl shrink-0">{n.icon || "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground leading-tight">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[8px] text-muted-foreground mt-1 uppercase font-medium">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.is_read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}