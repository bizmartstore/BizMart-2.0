const handleDailyClaim = async () => {
    if (!user || !canClaimDaily || claimingDaily) return;
    
    setClaimingDaily(true);
    try {
      const reward = DAILY_REWARDS[dailyLogin.currentDay - 1] || 0.5;
      
      // Get current balance first to calculate newBalance
      const { data: currentWallet } = await (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const currentBalance = Number(currentWallet?.balance || 0);
      const newBalance = currentBalance + reward;

      await withRetry(async () => {
        if (currentWallet) {
          await (supabase as any)
            .from("bcoins_wallets")
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } else {
          await (supabase as any)
            .from("bcoins_wallets")
            .insert({ user_id: user.id, balance: newBalance });
        }

        await (supabase as any).from("bcoins_transactions").insert({
          user_id: user.id,
          amount: reward,
          type: "daily_login",
          description: `Day ${dailyLogin.currentDay} daily login reward`,
        });
      });

      // Update local state
      const now = new Date();
      const nextDay = dailyLogin.currentDay >= 7 ? 1 : dailyLogin.currentDay + 1;
      const newState: DailyLoginState = {
        lastClaim: now.toISOString(),
        currentDay: nextDay,
        cycleStart: dailyLogin.currentDay >= 7 ? now.toISOString() : dailyLogin.cycleStart,
      };
      
      setDailyLogin(newState);
      localStorage.setItem(`bcoins_daily_${user.id}`, JSON.stringify(newState));
      setCanClaimDaily(false);
      
      // Refresh wallet display
      setWallet(prev => prev ? { ...prev, balance: newBalance } : { balance: newBalance });
      
      toast({ 
        title: "Daily Reward Claimed! 🎉", 
        description: `You earned +${reward} BCoins! Come back tomorrow for Day ${nextDay}.` 
      });
    } catch (e: any) {
      console.error("Daily claim error:", e);
      toast({ title: "Error", description: e.message || "Failed to claim reward", variant: "destructive" });
    }
    setClaimingDaily(false);
  };