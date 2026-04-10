"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import BCoinsFeatures from "@/components/BCoinsFeatures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Coins, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, Loader2, Gift, AlertCircle, Gamepad2, CalendarCheck, Store, Star } from "lucide-react";
import { notifyAdminRedemption } from "@/lib/notifications";
import BizMonArena from "@/components/bizmon/BizMonArena";

interface DailyLoginState {
  lastClaim: string | null;
  currentDay: number;
  cycleStart: string;
}

const DAILY_REWARDS = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0];

const ED_GAMES = [
  { id: "math-quiz", title: "Math Quiz", desc: "Solve equations to earn BCoins", emoji: "🧮", reward: "0.5-2.0", status: "coming-soon" },
  { id: "word-scramble", title: "Word Scramble", desc: "Unscramble words for rewards", emoji: "🔤", reward: "0.5-1.5", status: "coming-soon" },
  { id: "science-trivia", title: "Science Trivia", desc: "Test your science knowledge", emoji: "🔬", reward: "1.0-3.0", status: "coming-soon" },
  { id: "history-quest", title: "History Quest", desc: "Explore historical events", emoji: "📜", reward: "0.5-2.0", status: "coming-soon" },
  { id: "bizmon-arena", title: "BizMon Arena", desc: "Battle, train, and earn!", emoji: "⚔️", reward: "0-2/day", status: "available" },
];

const REDEEM_OPTIONS = [
  { gcash: 50, bcoins: 500 },
  { gcash: 100, bcoins: 1000 },
  { gcash: 200, bcoins: 2000 },
  { gcash: 500, bcoins: 5000 },
];

export default function BCoinsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedeem, setSelectedRedeem] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Daily Login State
  const [dailyLogin, setDailyLogin] = useState<DailyLoginState>({
    lastClaim: null,
    currentDay: 1,
    cycleStart: new Date().toISOString(),
  });
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [showBizMon, setShowBizMon] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [walletRes, transRes] = await Promise.all([
        (supabase as any).from("bcoins_wallets").select("*").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("bcoins_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      ]);
      
      setWallet(walletRes.data);
      setTransactions(transRes.data || []);
    } catch (e) {
      console.error("BCoinsPage loadData error:", e);
    }
    setLoading(false);
  };

  const checkDailyClaimability = (state: DailyLoginState) => {
    if (!state.lastClaim) return true;
    
    const now = new Date();
    const lastClaimDate = new Date(state.lastClaim);
    
    // Use Intl.DateTimeFormat to get Manila calendar date parts
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    
    const nowParts = formatter.formatToParts(now);
    const claimParts = formatter.formatToParts(lastClaimDate);
    
    const nowStr = `${nowParts.find(p => p.type === 'year')?.value}-${nowParts.find(p => p.type === 'month')?.value}-${nowParts.find(p => p.type === 'day')?.value}`;
    const claimStr = `${claimParts.find(p => p.type === 'year')?.value}-${claimParts.find(p => p.type === 'month')?.value}-${claimParts.find(p => p.type === 'day')?.value}`;

    return nowStr !== claimStr;
  };

  const loadDailyRewardState = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from("daily_login_rewards")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const state: DailyLoginState = {
          lastClaim: data.last_claim_at,
          currentDay: data.current_day || 1,
          cycleStart: data.cycle_start_at || new Date().toISOString(),
        };
        setDailyLogin(state);
        setCanClaimDaily(checkDailyClaimability(state));
      } else {
        const initialState = {
          user_id: user.id,
          current_day: 1,
          cycle_start_at: new Date().toISOString(),
        };
        await (supabase as any).from("daily_login_rewards").insert(initialState);
        setDailyLogin({ lastClaim: null, currentDay: 1, cycleStart: initialState.cycle_start_at });
        setCanClaimDaily(true);
      }
    } catch (err) {
      console.error("Failed to load daily reward state:", err);
    }
  }, [user]);

  useEffect(() => { 
    if (user) {
      loadData();
      loadDailyRewardState();
    }
  }, [user, loadDailyRewardState]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("bcoins-wallet-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_wallets", filter: `user_id=eq.${user.id}` },
        (payload: any) => { 
          if (payload.new) setWallet(payload.new);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleDailyClaim = async () => {
    if (!user || !canClaimDaily || claimingDaily) return;
    
    setClaimingDaily(true);
    try {
      const reward = DAILY_REWARDS[dailyLogin.currentDay - 1] || 0.5;
      const now = new Date().toISOString();
      
      // Update DB state
      const isCycleEnd = dailyLogin.currentDay >= 7;
      const nextDay = isCycleEnd ? 1 : dailyLogin.currentDay + 1;
      
      const { error: updateStateError } = await (supabase as any)
        .from("daily_login_rewards")
        .update({
          last_claim_at: now,
          current_day: nextDay,
          cycle_start_at: isCycleEnd ? now : dailyLogin.cycleStart,
          updated_at: now
        })
        .eq("user_id", user.id);

      if (updateStateError) throw updateStateError;

      // Update Wallet
      const { data: currentWallet } = await (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const currentBalance = Number(currentWallet?.balance || 0);
      const newBalance = currentBalance + reward;

      if (currentWallet) {
        await (supabase as any).from("bcoins_wallets").update({ balance: newBalance, updated_at: now }).eq("user_id", user.id);
      } else {
        await (supabase as any).from("bcoins_wallets").insert({ user_id: user.id, balance: newBalance });
      }

      // Log Transaction
      await (supabase as any).from("bcoins_transactions").insert({
        user_id: user.id,
        amount: reward,
        type: "daily_login",
        description: `Day ${dailyLogin.currentDay} reward claimed`,
      });

      setDailyLogin({
        lastClaim: now,
        currentDay: nextDay,
        cycleStart: isCycleEnd ? now : dailyLogin.cycleStart,
      });
      setCanClaimDaily(false);
      setWallet((prev: any) => ({ ...prev, balance: newBalance }));
      
      toast({ 
        title: "Reward Claimed! 🎉", 
        description: `+${reward} BCoins earned! ${isCycleEnd ? "7-day cycle complete! Day 1 starts tomorrow." : `Come back tomorrow for Day ${nextDay}.`}` 
      });
      
      refreshProfile();
    } catch (e: any) {
      console.error("Daily claim error:", e);
      toast({ title: "Error", description: e.message || "Failed to claim reward", variant: "destructive" });
    }
    setClaimingDaily(false);
  };

  const handleRedeem = async () => {
    if (!selectedRedeem || !gcashNumber.trim() || !user || !wallet) return;
    const option = REDEEM_OPTIONS.find((o) => o.gcash === selectedRedeem);
    if (!option) return;

    if (gcashNumber.length !== 11) {
      toast({ title: "Invalid Number", description: "Enter a valid 11-digit GCash number.", variant: "destructive" });
      return;
    }
    if (Number(wallet.balance) < option.bcoins) {
      toast({ title: "Insufficient BCoins", description: `You need ${option.bcoins} BCoins.`, variant: "destructive" });
      return;
    }

    setRedeeming(true);
    try {
      const newBalance = Number(wallet.balance) - option.bcoins;
      await (supabase as any).from("bcoins_wallets").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      await (supabase as any).from("bcoins_transactions").insert({
        user_id: user.id,
        amount: -option.bcoins,
        type: "redeem_gcash",
        description: `Redeemed ₱${option.gcash} GCash to ${gcashNumber}`,
      });
      await (supabase as any).from("bcoins_redemptions").insert({
        user_id: user.id,
        bcoins_amount: option.bcoins,
        gcash_amount: option.gcash,
        gcash_number: gcashNumber,
        status: "pending",
      });

      const userName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
      notifyAdminRedemption(userName, option.gcash);
      toast({ title: "Redemption Submitted! 🎉", description: `₱${option.gcash} GCash requested.` });
      setSelectedRedeem(null);
      setGcashNumber("");
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to process", variant: "destructive" });
    }
    setRedeeming(false);
  };

  const displayBalance = wallet?.balance != null ? Number(wallet.balance).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-6 w-6 text-warning" />
          <h1 className="font-extrabold text-lg">BCoins</h1>
        </div>

        {!showBizMon ? (
          <>
            <div className="bg-gradient-to-br from-warning/20 to-primary/10 rounded-2xl p-5 border border-warning/20 mb-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
              <p className="text-4xl font-extrabold text-warning">{displayBalance}</p>
              <p className="text-xs text-muted-foreground mt-1">BCoins</p>
            </div>

            <BCoinsFeatures activeSection={activeSection} onSectionChange={setActiveSection} />

            <div className="mt-5">
              <DailyLoginCard 
                onClaim={handleDailyClaim} 
                canClaim={canClaimDaily} 
                currentDay={dailyLogin.currentDay}
                lastClaim={dailyLogin.lastClaim}
                isClaiming={claimingDaily}
              />
            </div>

            {activeSection === 'store' && (
              <div className="mt-5 bg-card rounded-2xl p-4 border border-border animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm">BCoins Store</h2>
                    <p className="text-[10px] text-muted-foreground">Redeem BCoins for GCash</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {REDEEM_OPTIONS.map((opt) => (
                    <button key={opt.gcash} onClick={() => setSelectedRedeem(opt.gcash)}
                      className={`p-3 rounded-xl border text-center transition-all ${selectedRedeem === opt.gcash ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}>
                      <p className="font-bold text-sm text-foreground">₱{opt.gcash}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.bcoins} BCoins</p>
                    </button>
                  ))}
                </div>
                {selectedRedeem && (
                  <div className="space-y-3">
                    <Input type="tel" placeholder="GCash Number (09XXXXXXXXX)" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))} className="text-sm" />
                    <Button onClick={handleRedeem} disabled={redeeming || !gcashNumber} className="w-full h-11 font-bold rounded-xl">
                      {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Redeem Now"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'games' && (
              <div className="mt-5">
                <EdGamesSection onPlayBizMon={() => setShowBizMon(true)} />
              </div>
            )}

            <div className="mt-5">
              <h3 className="font-bold text-sm mb-3">Transaction History</h3>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 bg-card rounded-2xl border border-dashed border-border">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${(tx.amount || 0) > 0 ? "bg-success/10" : "bg-destructive/10"}`}>
                          {(tx.amount || 0) > 0 ? <ArrowDownCircle className="h-4 w-4 text-success" /> : <ArrowUpCircle className="h-4 w-4 text-destructive" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground capitalize">{(tx.type || "").replace("_", " ")}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{tx.description || ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${(tx.amount || 0) > 0 ? "text-success" : "text-destructive"}`}>
                          {(tx.amount || 0) > 0 ? "+" : ""}{Number(tx.amount || 0).toFixed(1)}
                        </p>
                        <p className="text-[9px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <BizMonArena onBack={() => setShowBizMon(false)} />
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function DailyLoginCard({ onClaim, canClaim, currentDay, lastClaim, isClaiming }: { onClaim: () => void; canClaim: boolean; currentDay: number; lastClaim: string | null; isClaiming: boolean }) {
  // Correctly calculate which day is actually "Next"
  const activeDay = canClaim ? currentDay : (currentDay === 1 ? 7 : currentDay - 1);
  
  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-amber-400/10 rounded-2xl border border-orange-200/30 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Daily Rewards</h3>
            <p className="text-[10px] text-muted-foreground">Login daily to earn free BCoins!</p>
          </div>
        </div>
        {canClaim && (
          <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600 animate-pulse">READY</span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {DAILY_REWARDS.map((reward, idx) => {
          const dayNum = idx + 1;
          const isPreviouslyClaimed = !canClaim ? dayNum < currentDay : dayNum < currentDay;
          const isActuallyToday = canClaim && dayNum === currentDay;
          const isClaimedToday = !canClaim && dayNum === (currentDay === 1 ? 7 : currentDay - 1);
          
          const isCheckmarked = isPreviouslyClaimed || isClaimedToday;

          return (
            <div key={dayNum} className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg text-center transition-all ${
              isCheckmarked ? "bg-green-100 border border-green-200" : 
              isActuallyToday ? "bg-orange-100 border-2 border-orange-400 shadow-sm scale-105 z-10" : "bg-muted/50 border border-border opacity-60"
            }`}>
              <span className="text-[8px] font-bold text-muted-foreground">Day {dayNum}</span>
              <span className={`text-xs font-extrabold ${isCheckmarked ? "text-green-600" : isActuallyToday ? "text-orange-600" : "text-muted-foreground"}`}>
                {isCheckmarked ? "✓" : `+${reward}`}
              </span>
            </div>
          );
        })}
      </div>

      <Button onClick={onClaim} disabled={!canClaim || isClaiming} className="w-full h-11 font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-lg active:scale-95 transition-all">
        {isClaiming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
        {canClaim ? `Claim Day ${currentDay} Reward` : "Claimed for Today"}
      </Button>
      {!canClaim && lastClaim && (
        <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium">
          Next reward available tomorrow!
        </p>
      )}
    </div>
  );
}

function EdGamesSection({ onPlayBizMon }: { onPlayBizMon: () => void }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
          <Gamepad2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-extrabold text-sm text-foreground">BCoins Ed-Games</h3>
          <p className="text-[10px] text-muted-foreground">Play educational games to earn!</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ED_GAMES.map((game) => {
          const isAvailable = game.status === "available";
          return (
            <div key={game.id} onClick={isAvailable ? onPlayBizMon : undefined}
              className={`relative bg-muted/30 rounded-xl p-3 border border-border ${isAvailable ? "cursor-pointer hover:bg-muted/50 transition-colors active:scale-95" : "opacity-70"}`}>
              <div className="text-2xl mb-1">{game.emoji}</div>
              <h4 className="font-bold text-xs text-foreground">{game.title}</h4>
              <p className="text-[9px] text-muted-foreground line-clamp-1">{game.desc}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star className="h-3 w-3 text-warning fill-warning" />
                <span className="text-[9px] font-bold text-warning">Earn {game.reward}</span>
              </div>
              {!isAvailable && <span className="absolute top-2 right-2 text-[10px]">🔒</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}