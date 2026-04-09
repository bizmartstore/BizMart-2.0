// Inside OrdersTab – updateStatus function (replace the existing function body)
const updateStatus = async (orderId: string, newStatus: string) => {
  setUpdating(id);
  try {
    const { data: tx } = await (supabase as any)
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!tx) {
      toast.error("Transaction not found");
      return;
    }

    // Optimistic update – update local state immediately
    setTransactions(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

    // ---------------------------------------------------------------
    // NEW: Notify the customer via push when status changes
    // ---------------------------------------------------------------
    // Build a nice title / message based on the new status
    const statusMessages: Record<string, string> = {
      pending: "Your order is still pending.",
      approved: "Your order has been APPROVED! 🎉",
      completed: "Your order has been COMPLETED! 📦",
      rejected: "Your order was REJECTED. 😞",
    };
    const msgTitle = `Order ${newStatus.toUpperCase()} 🚀`;
    const msgBody = `Your order status has changed to *${newStatus.toLowerCase()}.`;

    // Call the edge function that actually sends the push    const { data, error } = await fetch(
      "https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/notify-customer",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: msgTitle,
          message: msgBody,
          type: "order_status",
          userId: tx.user_id,
          link: `/order/${tx.id}`,
          icon: "📦",
        }),
      });

      if (error) {
        console.error("Notify‑customer edge failed:", error);
      }
    // ---------------------------------------------------------------------------

    // Continue with existing logic...
  } catch (e: any) {
    toast.error(e.message || "Failed to update");
  } finally {
    setUpdating(null);
  }
};