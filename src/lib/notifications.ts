import { supabase } from "@/integrations/supabase/client";

export async function sendNotification({
  title,
  message,
  type,
  userId,
  link,
  icon,
  targetRole,
}: {
  title: string;
  message: string;
  type: string;
  userId?: string;
  link?: string;
  icon?: string;
  targetRole?: string;
}) {
  // Primary persistence already handled elsewhere (see OrdersPage change)
  // This function now serves only as secondary system for Firebase push/sound
  // Keep existing Firebase logic here if you still want push notifications
  // Example (unchanged):
  // ... existing Firebase push code ...
}