// Inside PrintTab – wherever you update a print order status (e.g., in updateStatus or similar)
const updateStatus = async (orderId: string, newStatus: string) => {
  // … existing DB update code …

  // NEW: Notify the customer via push
  const statusMessages: Record<string, string> = {
    pending: "Your order is still pending.",
    approved: "Your order has been APPROVED! 🎉",
    completed: "Your order has been COMPLETED! 📦",
    rejected: "Your order was REJECTED. 😞",
  };
  const msgTitle = `Print Order ${newStatus.toUpperCase()} 🖨️`;
  const msgBody = `Your print order status has changed to *${newStatus.toLowerCase()}.`;

  // Call the edge function that actually sends the push
  const { data, error } = await fetch(
    "https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/notify-customer",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: msgTitle,
        message: msgBody,
        type: "print_status",
        userId: orderToUpdate.user_id,
        link: `/print-order/${orderId}`,
        icon: "🖨️",
      }),
    );

    if (error) {
      console.error("Notify‑customer edge failed:", error);
    }
  // ... rest of existing logic
};