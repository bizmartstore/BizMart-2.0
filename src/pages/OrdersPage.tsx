// Add this useEffect after the existing ones:

  // Realtime updates for orders
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel("orders-updates")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "orders",
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refresh orders when any change occurs
        (supabase as any)
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then(({ data }: any) => setOrders(data || []));
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Realtime updates for print orders
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel("print-orders-updates")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "print_orders",
        filter: `user_id=eq.${user.id}`
      }, () => {
        (supabase as any)
          .from("print_orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then(({ data }: any) => setPrintOrders(data || []));
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user]);