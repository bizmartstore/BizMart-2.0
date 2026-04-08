// Replace the erroneous insert call with a typed version
await supabase
  .from<Notification>('notifications')
  .insert(adminNotifications as Notification[]);