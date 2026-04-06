// ... existing code ...

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }: any) => setOrderCount(count || 0));
  }, [user]);

  // ✅ FIX: Add realtime subscription for wallet balance
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-wallet-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bcoins_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log("[ProfilePage] Wallet updated:", payload);
          if (payload.new && profile) {
            const newBalance = Number((payload.new as any).balance);
            setProfile(prev => prev ? { ...prev, bcoins: newBalance } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

// ... existing code ...