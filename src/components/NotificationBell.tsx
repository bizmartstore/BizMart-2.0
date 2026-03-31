import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { playCustomerNotificationSound, playAdminNotificationSound } from "@/lib/notificationSound";

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastNotificationId = useRef<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await (supabase as any)
        .from("notification_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      const notifs = data || [];
      setNotifications(notifs);
      
      // Safely count unread
      const newUnread = notifs.filter((n: any) => !n.is_read).length;
      setUnreadCount(newUnread);
      
      if (newUnread > 0 && notifs.length > 0) {
        const latest = notifs[0];
        if (latest.id !== lastNotificationId.current) {
          lastNotificationId.current = latest.id;
          
          // Use profile?.role safely
          const isAdmin = profile?.role === 'main_admin' || profile?.role === 'member_admin';
          if (isAdmin) {
            playAdminNotificationSound();
          } else {
            playCustomerNotificationSound();
          }
        }
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, [user, profile]);

  useEffect(() => {
    loadNotifications();
    
    if (!user) return;
    const channel = supabase      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_logs", filter: `user_id=eq.${user.id}` },
        () => { loadNotifications(); }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user, loadNotifications]);

  // Optimistic mark all as read
  const markAllAsRead = async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    try {
      await (supabase as any)
        .from("notification_logs")
        .update({ is_read: true })
        .eq("user_id", user.id);
    } catch (error) {
      console.warn("Failed to mark notifications as read:", error);
    }
  };

  // Optimistic mark single as read
  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await (supabase as any).from("notification_logs").update({ is_read: true }).eq("id", id);
    } catch (error) {
      console.warn("Failed to mark notification as read:", error);
    }
  };

  // Optimistic delete single
  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await (supabase as any).from("notification_logs").delete().eq("id", id);
    } catch (error) {
      console.warn("Failed to delete notification:", error);
    }
  };

  // Optimistic clear all
  const clearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await (supabase as any).from("notification_logs").delete().eq("user_id", user?.id);
    } catch (error) {
      console.warn("Failed to clear notifications:", error);
    }
  };

  const handleNotifClick = async (n: any) => {
    setOpen(false);
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button         onClick={() => setOpen(!open)} 
        className="p-1.5 relative hover:bg-muted rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-[400px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 fade-in duration-200">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
            <span className="font-bold text-xs">Notifications</span>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[10px] text-primary font-bold hover:underline">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-destructive font-bold hover:underline">
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto max-h-[340px]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`w-full text-left px-4 py-2 rounded-lg text-xs transition-colors group relative ${
                    n.is_read ? 'opacity-60' : 'bg-primary/5'
                  }`}
                >
                  <button                    onClick={() => handleNotifClick(n)}
                    className="w-full flex items-start gap-2"
                  >
                    <span className="text-xl shrink-0 mt-0.5">{n.icon || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground leading-tight">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[8px] text-muted-foreground mt-1 uppercase font-medium">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}