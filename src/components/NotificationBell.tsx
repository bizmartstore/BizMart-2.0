"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { playCustomerNotificationSound, playAdminNotificationSound } from "@/lib/notificationSound";
import { toast } from "sonner";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sound engine state:
  // - mountTime: notifications made BEFORE this moment are "old news" and must
  //   never ring, even if still unread. This is what stops the ring replaying
  //   every time the user leaves a tab and comes back.
  // - seenIds: notifications already surfaced this session. Only an id that is
  //   fresh (created after mount) and not yet seen will play the sound.
  const mountTimeRef = useRef<number>(Date.now());
  const seenIdsRef = useRef<Set<string> | null>(null);

  const isAdminView =
    profile?.role === "main_admin" || profile?.role === "member_admin";

  const visibilityFilter = useCallback(() => {
    if (!user) return null;
    // 'admin' kept for older rows that used the shorter role name.
    if (isAdminView) {
      return `user_id.eq.${user.id},target_role.in.(main_admin,member_admin,admin)`;
    }
    return `user_id.eq.${user.id},target_role.eq.customer`;
  }, [user, isAdminView]);

  const loadNotifications = useCallback(
    async (opts?: { playSoundForNew?: boolean }) => {
      if (!user) return;
      try {
        const filter = visibilityFilter();
        let query = (supabase as any)
          .from("notification_logs")
          .select("*")
          .order("created_at", { ascending: false });

        if (filter) query = query.or(filter);

        const { data, error } = await query;
        if (error) {
          console.error("Failed to load notifications:", error);
          return;
        }

        const notifs = (data || []) as any[];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.is_read).length);

        // Record what we've seen; decide whether to ring.
        const previous = seenIdsRef.current;
        const freshUnreadIds = notifs
          .filter((n) => !n.is_read && new Date(n.created_at).getTime() > mountTimeRef.current - 5000)
          .map((n) => n.id);

        if (previous === null) {
          // First load: baseline only, never ring.
          seenIdsRef.current = new Set(notifs.map((n) => n.id));
        } else if (opts?.playSoundForNew !== false) {
          const brandNew = freshUnreadIds.filter((id) => !previous.has(id));
          if (brandNew.length > 0) {
            brandNew.forEach((id) => previous.add(id));
            if (isAdminView) {
              playAdminNotificationSound();
            } else {
              playCustomerNotificationSound();
            }
          }
        }
        // Keep the seen-set current for read ones too.
        notifs.forEach((n) => seenIdsRef.current?.add(n.id));
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    },
    [user, visibilityFilter, isAdminView]
  );

  useEffect(() => {
    loadNotifications({ playSoundForNew: false });

    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_logs" },
        () => loadNotifications()
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
          setUnreadCount((prev) => {
            if (payload.new.is_read) return Math.max(0, prev - 1);
            return prev + 1;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAsRead = async (id: string) => {
    if (!id) return;
    try {
      const { error } = await (supabase as any)
        .from("notification_logs")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Could not mark as read", { description: error?.message });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      let query = (supabase as any)
        .from("notification_logs")
        .update({ is_read: true })
        .eq("is_read", false);

      const filter = visibilityFilter();
      if (filter) query = query.or(filter);

      const { error } = await query;
      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      // Confirm nothing was blocked (e.g. missing DB permission).
      const { data: unreadLeft, error: checkError } = await (supabase as any)
        .from("notification_logs")
        .select("id")
        .eq("is_read", false)
        .or(filter!);

      if (!checkError && unreadLeft && unreadLeft.length > 0) {
        toast.error("Some notifications could not be marked as read", {
          description: "The database blocked it. Run supabase/sql/fix_notification_logs_rls.sql in the Supabase SQL Editor to enable it.",
        });
      }

      await loadNotifications({ playSoundForNew: false });
    } catch (error: any) {
      console.error("Failed to mark all as read:", error);
      toast.error("Could not mark all as read", { description: error?.message });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("notification_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => {
        const wasUnread = notifications.find((n) => n.id === id && !n.is_read);
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch (error: any) {
      console.error("Failed to delete notification:", error);
      toast.error("Could not delete notification", { description: error?.message });
    }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      let query = (supabase as any)
        .from("notification_logs")
        .delete();

      const filter = visibilityFilter();
      if (filter) query = query.or(filter);

      const { error } = await query;
      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);

      // Confirm from the database — if rows survive (blocked write), warn.
      const { data: stillThere, error: checkError } = await (supabase as any)
        .from("notification_logs")
        .select("id")
        .or(filter!);
      if (!checkError && stillThere && stillThere.length > 0) {
        toast.error("Some notifications could not be deleted", {
          description: "The database blocked it. Run supabase/sql/fix_notification_logs_rls.sql in the Supabase SQL Editor to enable clearing.",
        });
      }
    } catch (error: any) {
      console.error("Failed to clear notifications:", error);
      toast.error("Could not clear notifications", { description: error?.message });
    } finally {
      await loadNotifications({ playSoundForNew: false });
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
