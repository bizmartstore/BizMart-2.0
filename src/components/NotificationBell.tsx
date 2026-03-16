import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Copy, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "@/hooks/use-toast";
import { playCustomerNotificationSound, playAdminNotificationSound } from "@/lib/notificationSound";

function extractCode(message: string): string | null {
  const codeMatch = message.match(/code:\s*(?:🎟️\s*)?([A-Za-z0-9_-]{4,20})/i);
  if (codeMatch) return codeMatch[1];
  const ticketMatch = message.match(/🎟️\s*([A-Za-z0-9_-]{4,20})/);
  if (ticketMatch) return ticketMatch[1];
  return null;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isAdminRef = useRef(isAdmin);

  // Keep ref in sync with isAdmin
  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  const load = useCallback(async () => {
    if (!user) return;

    const adminNow = isAdminRef.current;

    // Build query based on user role
    let query = (supabase as any)
      .from("notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (adminNow) {
      // Admins see: their own targeted, broadcast, and admin-role targeted      query = query.or(
        `target_user_id.eq.${user.id},and(target_user_id.is.null,target_role.is.null),target_role.eq.admin,target_role.eq.main_admin,target_role.eq.member_admin`
      );
    } else {
      // Regular users see: only their own targeted + broadcast (no role-targeted)
      query = query.or(
        `target_user_id.eq.${user.id},and(target_user_id.is.null,target_role.is.null)`
      );
    }

    const { data, error } = await query;
        if (error) {
      console.error("NotificationBell load error:", error);
      return;
    }
    
    setNotifications(data || []);

    // Count unread (since last visit)
    const lastSeen = localStorage.getItem(`notif_seen_${user.id}`) || "2000-01-01";
    const count = (data || []).filter((n: any) => new Date(n.created_at) > new Date(lastSeen)).length;
    setUnreadCount(count);
  }, [user]);

  // Load notifications when user or admin status changes
  useEffect(() => {
    if (!user || adminLoading) return;
    load();
  }, [user, isAdmin, adminLoading, load]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public",           table: "notification_logs",
          filter: `target_user_id=eq.${user.id}`
        },
        (payload: any) => {
          load();
          // Play notification sound
          const row = payload?.new;
          if (row) {
            const isForAdmin = row.target_role === "admin";
            const isForThisUser = row.target_user_id === user.id;
            const isBroadcast = !row.target_user_id && !row.target_role;
            
            if (isAdminRef.current && isForAdmin) {
              playAdminNotificationSound();
            } else if (isForThisUser || isBroadcast) {
              playCustomerNotificationSound();
            }
          }
        }
      )
      .subscribe();

    // Also listen for broadcast notifications (no target)
    const broadcastChannel = supabase
      .channel(`broadcast-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "notification_logs",
          filter: `target_user_id.is.null AND target_role.is.null`
        },
        (payload: any) => {
          load();
          playCustomerNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [user, load]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
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

  const handleCopyCode = async (e: React.MouseEvent, code: string, notifId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(notifId);
      toast({ title: "Code copied! 📋", description: code });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(notifId);
      toast({ title: "Code copied! 📋", description: code });
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={handleOpen} 
        className="p-1.5 relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-secondary-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 max-h-96 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="font-bold text-xs">Notifications</span>
            <button 
              onClick={() => {
                setOpen(false);
                if (user) {
                  localStorage.setItem(`notif_seen_${user.id}`, new Date().toISOString());
                  setUnreadCount(0);
                }
              }}
              className="text-[10px] text-primary font-semibold"
            >
              Mark all read
            </button>
          </div>
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">No notifications</p>
            ) : (
              notifications.map((n) => {
                const code = extractCode(n.message || "");
                const isCopied = copiedId === n.id;
                const isRead = user && new Date(n.created_at) <= new Date(localStorage.getItem(`notif_seen_${user.id}`) || "2000-01-01");

                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors ${!isRead ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm flex-shrink-0">{n.icon || "🔔"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-bold text-foreground truncate">{n.title}</p>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-3">{n.message}</p>

                        {code && (
                          <div
                            className="mt-1.5 flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-primary/15 transition-colors"
                            onClick={(e) => handleCopyCode(e, code, n.id)}
                          >
                            <span className="text-[11px] font-mono font-bold text-primary tracking-wider flex-1">
                              {code}
                            </span>
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        )}

                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}