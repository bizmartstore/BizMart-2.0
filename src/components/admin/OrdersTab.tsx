// ... existing code ...
await (supabase as any).from("messages").update({ is_read: true })
  .eq("conversation_id", conversation_id)
  .neq("sender_id", user.id)
  .eq("is_read", false);
  
// Trigger Push Notification to Customer
await notifyCustomerOrder(recipientId); // Remove extra argument
// If notifyCustomerOrder expects only userId, adjust its signature accordingly.