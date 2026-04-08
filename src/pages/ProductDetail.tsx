// Replace the erroneous insert calls with properly typed ones
await supabase
  .from('notifications')
  .insert([userNotification]);

await supabase
  .from('notifications')
  .insert(adminNotifications as any);