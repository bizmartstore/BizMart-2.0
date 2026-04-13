"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { playCustomerNotificationSound, playAdminNotificationSound } from "@/lib/notificationSound";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lastNotificationId = useRef<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      let query = (supabase as any)
        .from("notification_logs")
        .select("*")
        .order("created_at", { ascending: false });

      const isAdmin = profile?.role === "main_admin" || profile?.role === "member_admin";
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.or(`user_id.eq.${user.id},target_role.eq.admin`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to load notifications:", error);
        return;
      }

      const notifs = data || [];
      setNotifications(notifs);

      const newUnread = notifs.filter((n: any) => !n.is_read).length;
      setUnreadCount(newUnread);

      if (newUnread > 0 && notifs.length > 0) {
        const latest = notifs[0];
        if (latest.id !== lastNotificationId.current) {
          lastNotificationId.current = latest.id;
          const isAdmin = profile?.role === "main_admin" || profile?.role === "member_admin";
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
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_logs" },
        () => { loadNotifications(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notification_logs" },
        (payload: any) => {
          setNotifications((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((n) => n.id === payload.new.id);
            if (idx > -1) {
              updated[idx] = { ...updated[idx], is_read: payload.new.is_read };
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

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
      const isAdmin = profile?.role === "main_admin" || profile?.role === "member_admin";
      let query = (supabase as any)
        .from("notification_logs")
        .update({ is_read: true })
        .eq("is_read", false);

      if (isAdmin) {
        query = query.or(`user_id.eq.${user.id},target_role.eq.admin`);
      } else {
        query = query.eq("user_id", user.id);
      }

      const { error } = await query;
      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await (supabase as any).from("notification_logs").delete().eq("id", id);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const clearAll = async () => {
    try {
      const isAdmin = profile?.role === "main_admin" || profile?.role === "member_admin";
      if (isAdmin) {
        // Admins clear all notifications visible to them (targeted to admin or their user_id)
        await (supabase as any)
          .from("notification_logs")
          .delete()
          .or(`user_id.eq.${user.id},target_role.eq.admin`);
      } else {
        await (supabase as any).from("notification_logs").delete().eq("user_id", user.id);
      }
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
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-extrabold rounded-full h-4 min-w-4 flex items-center justify-center px-1 shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-[400px] bg-card border border-border rounded-2xl overflow-hidden z-50 animate-in zoom-in-95 fade-in duration-200">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
            <span className="font-bold text-xs">Notifications</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-[10px] font-bold"
              >
                Mark all read
              </Button>
              {notifications.length > 0 && (
                <Button
                  size="sm"
                  onClick={clearAll}
                  className="text-[10px] text-destructive font-bold hover:underline"
                >
                  Clear all
                </Button>
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
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors group relative ${
                    n.is_read ? "opacity-60" : "bg-primary/5"
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNotifClick(n); }}
                    className="w-full flex items-start gap-2"
                  >
                    <span className="text-xl shrink-0 mt-0.5">{n.icon || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground leading-tight">{n.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-[8px] text-muted-foreground mt-1 uppercase font-medium">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2"></div>
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all"
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