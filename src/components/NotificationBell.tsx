// ... (keep existing imports)
import { supabase } from "@/integrations/supabase/client";

// ... (rest of component)

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase
        .from("notification_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const isAdmin = profile?.role === 'main_admin' || profile?.role === 'member_admin';
      if (!isAdmin) {
        // For regular users, filter by user_id (the profile id)
        query = query.eq("user_id", user.id);
      } else {
        // For admins, show notifications targeted to them or all admins
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

// ... (rest of component)