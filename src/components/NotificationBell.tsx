"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { playCustomerNotificationSound } from "@/lib/notificationSound";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: convos, error } = await (supabase as any)
        .from("notification_logs")
        .select("*")
        .or(`user_id.eq.${user.id},target_role.eq.${profile?.role}`)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) {
        console.error("Failed to load notifications:", error);
        return;
      }
      setNotifications(convos || []);
      const newUnread = (convos || []).filter((n: any) => !n.is_read).length;
      setUnreadCount(newUnread);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [user, profile?.role]);

  useEffect(() => {
    loadNotifications();

    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_logs" },
        () => {
          loadNotifications();
          playCustomerNotificationSound();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadNotifications]);

  const markAsRead = async (id: string) => {
    if (!id) return;
    try {
      await (supabase as any).from("notification_logs").update({ is_read: true }).eq("id", id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await (supabase as any).from("notification_logs").update({ is_read: true }).eq("user_id", user.id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      await (supabase as any).from("notification_logs").delete().eq("user_id", user.id);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const handleNotifClick = async (n: any) => {
    setOpen(false);
    if (!n.is_read) {
      await markAsRead(n.id);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 relative hover:bg-muted rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1 shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-[400px] bg-card border border-border rounded-2xl overflow-hidden z-50 animate-in zoom-in-95 fade-in duration-300">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <span className="font-bold text-xs">Notifications</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={markAllAsRead} className="text-[10px] h-7 px-2">
                Mark all read
              </Button>
              {notifications.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clearAll} className="text-[10px] text-destructive font-bold hover:underline h-7 px-2">
                  Clear all
                </Button>
              )}
            </div>
          </div>
          <div className="h-[340px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-card rounded-lg p-2 border-b border-border flex items-start gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleNotifClick(n)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5">
                      <span className="text-xl shrink-0 mt-0.5">{n.icon || "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5 uppercase font-medium">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}