// ... existing code ...

  // Subscribe to wallet changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bcoins_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (!mountedRef.current) return;
          console.log("[AuthContext] Wallet change detected:", payload);
          
          if (payload.eventType === 'DELETE') {
            setProfile(prev => prev ? { ...prev, bcoins: 0 } : prev);
          } else if (payload.new) {
            const newBalance = Number((payload.new as any).balance);
            setProfile(prev => prev ? { ...prev, bcoins: newBalance } : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

// ... existing code ...