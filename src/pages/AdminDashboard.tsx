const pendingPollRef = useRef<NodeJS.Timeout | null>(null);

  const loadPendingCounts = useCallback(async () => {
    try {
      // Use Promise.allSettled so one failing table doesn't break the others
      const [ordersRes, printRes, gcashRes, bcoinsRes] = await Promise.allSettled([
        (supabase as any).from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("print_orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("gcash_transactions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("bcoins_redemptions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setPendingCounts({
        orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.count || 0) : 0,
        print: printRes.status === 'fulfilled' ? (printRes.value.count || 0) : 0,
        gcash: gcashRes.status === 'fulfilled' ? (gcashRes.value.count || 0) : 0,
        bcoins: bcoinsRes.status === 'fulfilled' ? (bcoinsRes.value.count || 0) : 0,
        messages: 0,
      });
    } catch (e) {
      console.error("Failed to load pending counts:", e);
    }
  }, []);

  useEffect(() => {
    if (isAuthReady && isAdmin) {
      loadPendingCounts();
    }
  }, [isAuthReady, isAdmin, loadPendingCounts]);

  useEffect(() => {
    if (!isAuthReady || !isAdmin) return;

    const channel = supabase
      .channel("admin-pending-counts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadPendingCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => loadPendingCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "gcash_transactions" }, () => loadPendingCounts())
      .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_redemptions" }, () => loadPendingCounts())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("[AdminDashboard] Pending counts realtime active");
        } else if (status === 'CHANNEL_ERROR') {
          console.warn("[AdminDashboard] Realtime channel error, relying on polling");
        }
      });

    // Poll every 5s for red notification badges only
    pendingPollRef.current = setInterval(() => {
      loadPendingCounts();
    }, 5000);

    return () => { 
      supabase.removeChannel(channel); 
      if (pendingPollRef.current) clearInterval(pendingPollRef.current);
    };
  }, [isAuthReady, isAdmin, loadPendingCounts]);