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
import { Coins, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, Loader2, Gift, AlertCircle, Gamepad2, CalendarCheck, Store, ChevronRight, Sparkles, Trophy, Star, Play } from "lucide-react";
import { notifyAdminRedemption } from "@/lib/notifications";
import BizMonArena from "@/components/bizmon/BizMonArena";

const DAILY_REWARDS = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0];

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
  const [currentDay, setCurrentDay] = useState(1);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);

  // BizMon Arena state
  const [showBizMon, setShowBizMon] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load Wallet
      const { data: w } = await (supabase as any).from("bcoins_wallets").select("*").eq("user_id", user.id).maybeSingle();
      setWallet(w);

      // Load Transactions
      const { data: t } = await (supabase as any).from("bcoins_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      setTransactions(t || []);

      // Calculate Daily Login Progress from DB
      const { data: lastLogin } = await (supabase as any)
        .from("bcoins_transactions")
        .select("created_at, description")
        .eq("user_id", user.id)
        .eq("type", "daily_login")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastLogin) {
        const lastDate = new Date(lastLogin.created_at);
        const now = new Date();
        
        // Reset time to compare dates only
        const lastDateStr = lastDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        
        setLastClaimDate(lastLogin.created_at);

        if (lastDateStr === todayStr) {
          // Already claimed today
          setCanClaimDaily(false);
          // Extract day number from description "Day X daily login reward"
          const match = lastLogin.description.match(/Day (\d+)/);
          setCurrentDay(match ? parseInt(match[1]) : 1);
        } else {
          // Check if it was yesterday to continue streak
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

          if (lastDateStr === yesterdayStr) {
            const match = lastLogin.description.match(/Day (\d+)/);
            const lastDay = match ? parseInt(match[1]) : 0;
            setCurrentDay(lastDay >= 7 ? 1 : lastDay + 1);
          } else {
            // Streak broken
            setCurrentDay(1);
          }
          setCanClaimDaily(true);
        }
      } else {
        // Never claimed
        setCurrentDay(1);
        setCanClaimDaily(true);
      }
    } catch (e) {
      console.error("BCoinsPage loadData error:", e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { 
    if (user) loadData();
  }, [user, loadData]);

  const handleDailyClaim = async () => {
    if (!user || !canClaimDaily || claimingDaily) return;
    
    setClaimingDaily(true);
    try {
      const reward = DAILY_REWARDS[currentDay - 1] || 0.5;
      
      // 1. Update Wallet
      const { data: currentWallet } = await (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      
      const newBalance = (Number(currentWallet?.balance || 0) + reward);

      if (currentWallet) {
        await (supabase as any).from("bcoins_wallets").update({ balance: newBalance }).eq("user_id", user.id);
      } else {
        await (supabase as any).from("bcoins_wallets").insert({ user_id: user.id, balance: reward });
      }

      // 2. Record Transaction
      await (supabase as any).from("bcoins_transactions").insert({
        user_id: user.id,
        amount: reward,
        type: "daily_login",
        description: `Day ${currentDay} daily login reward`,
      });

      toast({ 
        title: "Reward Claimed! 🎉", 
        description: `You earned +${reward} BCoins for Day ${currentDay}.` 
      });
      
      setCanClaimDaily(false);
      loadData();
      refreshProfile();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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

    setRededeeming(true);
    try {
      const { error: walletErr } = await (supabase as any)
        .from("bcoins_wallets")
        .update({ balance: Number(wallet.balance) - option.bcoins })
        .eq("user_id", user.id);
      
      if (walletErr) throw walletErr;

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
      toast({ title: "Redemption Submitted! 🎉", description: "Wait for admin approval." });
      setSelectedRedeem(null);
      setGcashNumber("");
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setRedeeming(false);
  };

  if (!user) return null;

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
              <p className="text-4xl font-extrabold text-warning">{wallet?.balance != null ? Number(wallet.balance).toFixed(1) : "0.0"}</p>
              <p className="text-xs text-muted-foreground mt-1">BCoins</p>
            </div>

            <BCoinsFeatures activeSection={activeSection} onSectionChange={setActiveSection} />

            <div className="mt-5">
              <DailyLoginCard 
                onClaim={handleDailyClaim} 
                canClaim={canClaimDaily} 
                currentDay={currentDay}
                isClaimedToday={!canClaimDaily && lastClaimDate !== null}
              />
            </div>

            {activeSection === 'store' && (
              <div className="mt-5 bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                    <Store className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm">BCoins Store</h2>
                    <p className="text-[10px] text-muted-foreground">Redeem your BCoins to GCash</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {REDEEM_OPTIONS.map((opt) => (
                    <button
                      key={opt.gcash}
                      onClick={() => setSelectedRedeem(opt.gcash)}
                      className={`p-3 rounded-xl border text-center transition-all ${selectedRedeem === opt.gcash ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
                    >
                      <p className="font-bold text-sm text-foreground">₱{opt.gcash}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.bcoins} BCoins</p>
                    </button>
                  ))}
                </div>
                {selectedRedeem && (
                  <div className="space-y-3">
                    <Input type="tel" placeholder="GCash Number" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))} className="text-sm" />
                    <Button onClick={handleRedeem} disabled={redeeming || !gcashNumber} className="w-full h-11 font-bold rounded-xl">
                      {redeeming ? "Processing..." : "Redeem Now"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5">
              <h3 className="font-bold text-sm mb-3">Transaction History</h3>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${(tx.amount || 0) > 0 ? "bg-green-100" : "bg-red-100"}`}>
                        {(tx.amount || 0) > 0 ? <ArrowDownCircle className="h-4 w-4 text-green-600" /> : <ArrowUpCircle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground capitalize">{(tx.type || "").replace("_", " ")}</p>
                        <p className="text-[10px] text-muted-foreground">{tx.description || ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${(tx.amount || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                        {(tx.amount || 0) > 0 ? "+" : ""}{Number(tx.amount || 0).toFixed(1)}
                      </p>
                      <p className="text-[9px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
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

function DailyLoginCard({ onClaim, canClaim, currentDay, isClaimedToday }: { onClaim: () => void; canClaim: boolean; currentDay: number; isClaimedToday: boolean }) {
  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-amber-400/10 rounded-2xl border border-orange-200/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Daily Login Rewards</h3>
            <p className="text-[10px] text-muted-foreground">Claim rewards every day!</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {DAILY_REWARDS.map((reward, idx) => {
          const day = idx + 1;
          const isPast = day < currentDay || (day === currentDay && isClaimedToday);
          const isCurrent = day === currentDay && !isClaimedToday;
          return (
            <div key={day} className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-center border ${isPast ? "bg-green-50 border-green-200" : isCurrent ? "bg-orange-100 border-orange-400" : "bg-muted/50 border-border opacity-60"}`}>
              <span className="text-[8px] font-bold text-muted-foreground">Day {day}</span>
              <span className={`text-xs font-extrabold ${isPast ? "text-green-600" : isCurrent ? "text-orange-600" : "text-muted-foreground"}`}>
                {isPast ? "✓" : `+${reward}`}
              </span>
            </div>
          );
        })}
      </div>
      <Button onClick={onClaim} disabled={!canClaim} className="w-full h-10 font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white">
        {isClaimedToday ? "Claimed Today! ✅" : `Claim Day ${currentDay} Reward`}
      </Button>
    </div>
  );
}