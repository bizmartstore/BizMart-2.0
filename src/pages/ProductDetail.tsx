import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Define the shape of a notification row
interface Notification {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  icon: string;
  is_read?: boolean;
  created_at: string;
}

// Define admin notification shape
interface AdminNotification extends Notification {
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  icon: string;
}

// ... existing code ...

// Example of where adminNotifications is used (ensure it's defined before use)
const adminNotifications: AdminNotification[] = admins.map((admin) => ({
  user_id: admin.user_id,
  title: "🛒 New Order Received",
  message: admin.reason,
  type: "order",
  link: "/messages",
  icon: "💬",
  is_read: false,
  created_at: new Date().toISOString(),
});

// Insert user notification
await supabase
  .from<Notification>('notifications')
  .insert([userNotification as any]);

// Insert admin notifications
await supabase
  .from<Notification>('notifications')
  .insert(adminNotifications as any);