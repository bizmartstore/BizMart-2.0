// Ensure the insert uses a typed array
await supabase
  .from<Notification>('notifications')
  .insert(adminNotifications as Notification[]);