import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import BCoinsFeatures from "@/components/BCoinsFeatures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Coins, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, Loader2, Gift, AlertCircle, Store, ArrowLeft, Disc, Sparkles, Trophy } from "lucide-react";
import { notifyAdminRedemption } from "@/lib/notifications";

const DAILY_REWARDS = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0];

const REDEEM_OPTIONS = [
  { gcash: 50, bcoins: 500 },
  { gcash: 100, bcoins: 1000 },
  { gcash: 200, bcoins: 2000 },
  { gcash: 500, bcoins: 5000 },
];

interface DailyLoginState {
  lastClaim: string | null;
  currentDay: number;
  cycleStart: string;
}

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

  // Spin the Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [canSpin, setCanSpin] = useState(false);
  const [checkingSpin, setCheckingSpin] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: w } = await (supabase as any).from("bcoins_wallets").select("*").eq("user_id", user.id).maybeSingle();
      setWallet(w);
      const { data: t } = await (supabase as any).from("bcoins_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      setTransactions(t || []);
      
      // Check if user can spin today (stored in DB transactions)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: lastSpin } = await (supabase as any)
        .from("bcoins_transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "wheel_spin")
        .gte("created_at", today.toISOString())
        .maybeSingle();
      
      setCanSpin(!lastSpin);
    } catch (e) {
      console.error("BCoinsPage loadData error:", e);
    } finally {
      setLoading(false);
      setCheckingSpin(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
      
      // Load daily login from local storage (as requested, only spin is DB-backed for now)
      const stored = localStorage.getItem(`bcoins_daily_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDailyLogin(parsed);
        if (parsed.lastClaim) {
          const lastClaimDate = new Date(parsed.lastClaim);
          const hoursSinceClaim = (new Date().getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);
          setCanClaimDaily(hoursSinceClaim >= 24);
        } else {
          setCanClaimDaily(true);
        }
      } else {
        setCanClaimDaily(true);
      }
    }
  }, [user, loadData]);

  const handleDailyClaim = async () => {
    if (!user || !canClaimDaily || claimingDaily) return;
    setClaimingDaily(true);
    try {
      const reward = DAILY_REWARDS[dailyLogin.currentDay - 1] || 0.5;
      const currentBalance = Number(wallet?.balance || 0);
      const newBalance = currentBalance + reward;

      await (supabase as any).from("bcoins_wallets").upsert({ user_id: user.id, balance: newBalance });
      await (supabase as any).from("bcoins_transactions").insert({
        user_id: user.id,
        amount: reward,
        type: "daily_login",
        description: `Day ${dailyLogin.currentDay} daily login reward`,
      });

      const nextDay = dailyLogin.currentDay >= 7 ? 1 : dailyLogin.currentDay + 1;
      const newState = {
        lastClaim: new Date().toISOString(),
        currentDay: nextDay,
        cycleStart: dailyLogin.currentDay >= 7 ? new Date().toISOString() : dailyLogin.cycleStart,
      };
      setDailyLogin(newState);
      localStorage.setItem(`bcoins_daily_${user.id}`, JSON.stringify(newState));
      setCanClaimDaily(false);
      setWallet({ ...wallet, balance: newBalance });
      toast({ title: "Reward Claimed! 🎉", description: `+${reward} BCoins added to your wallet.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setClaimingDaily(false);
  };

  const handleSpin = async () => {
    if (!user || !canSpin || isSpinning) return;
    setIsSpinning(true);
    setSpinResult(null);

    // Probabilities:
    // 70% - Better luck next time (0)
    // 15% - 1 BCoin
    // 8% - 2 BCoins
    // 5% - 3 BCoins
    // 2% - 10 BCoins
    const rand = Math.random() * 100;
    let reward = 0;
    if (rand < 2) reward = 10;
    else if (rand < 7) reward = 3;
    else if (rand < 15) reward = 2;
    else if (rand < 30) reward = 1;
    else reward = 0;

    // Simulate spin animation delay
    setTimeout(async () => {
      try {
        const currentBalance = Number(wallet?.balance || 0);
        const newBalance = currentBalance + reward;

        // Save to DB immediately so it persists even if app is reinstalled
        await (supabase as any).from("bcoins_wallets").upsert({ user_id: user.id, balance: newBalance });
        await (supabase as any).from("bcoins_transactions").insert({
          user_id: user.id,
          amount: reward,
          type: "wheel_spin",
          description: reward > 0 ? `Won ${reward} BCoins from Spin the Wheel!` : "Better luck next time!",
        });

        setSpinResult(reward);
        setCanSpin(false);
        setWallet({ ...wallet, balance: newBalance });
        
        if (reward > 0) {
          toast({ title: "Congratulations! 🏆", description: `You won ${reward} BCoins!` });
        } else {
          toast({ title: "Better luck next time! 🍀", description: "Try again tomorrow!" });
        }
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
        setIsSpinning(false);
      }
    }, 3000);
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
      await (supabase as any).from("bcoins_wallets").update({ balance: newBalance }).eq("user_id", user.id);
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
      toast({ title: "Redemption Submitted! 🎉", description: `₱${option.gcash} GCash will be sent after approval.` });
      setSelectedRedeem(null);
      setGcashNumber("");
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setRedeeming(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Coins className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">BCoins Wallet</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to view your BCoins.</p>
          <Button onClick={() => window.location.href = "/login"}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── STORE VIEW ───
  if (activeSection === 'store') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => setActiveSection(null)} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-extrabold text-lg">BCoins Store</h1>
        </div>
        <div className="px-4 py-6 space-y-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl p-5 border border-emerald-500/20 text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Your Balance</p>
            <p className="text-3xl font-extrabold text-emerald-600">{Number(wallet?.balance || 0).toFixed(1)} 🪙</p>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold text-sm flex items-center gap-2"><Gift className="h-4 w-4 text-emerald-500" /> Select Redemption Amount</h2>
            <div className="grid grid-cols-2 gap-3">
              {REDEEM_OPTIONS.map((opt) => (
                <button
                  key={opt.gcash}
                  onClick={() => setSelectedRedeem(opt.gcash)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    selectedRedeem === opt.gcash
                      ? "border-emerald-500 bg-emerald-500/10 shadow-inner"
                      : "border-border bg-card shadow-sm active:scale-95"
                  }`}
                >
                  <p className="font-black text-lg text-foreground">₱{opt.gcash}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">{opt.bcoins} BCoins</p>
                </button>
              ))}
            </div>
          </div>

          {selectedRedeem && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground ml-1">GCash Number</label>
                <Input
                  type="tel"
                  placeholder="09XXXXXXXXX"
                  value={gcashNumber}
                  onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="h-12 rounded-xl text-base font-bold tracking-widest"
                />
              </div>
              <Button onClick={handleRedeem} disabled={redeeming || gcashNumber.length !== 11} className="w-full h-14 font-black text-lg rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
                {redeeming ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                {redeeming ? "Processing..." : `Redeem ₱${selectedRedeem} GCash`}
              </Button>
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── SPIN VIEW ───
  if (activeSection === 'spin') {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-card flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => setActiveSection(null)} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-extrabold text-lg">Spin the Wheel</h1>
        </div>
        <div className="px-4 py-12 flex flex-col items-center text-center space-y-8">
          <div className="relative">
            <div className={`w-64 h-64 rounded-full border-8 border-primary/20 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 shadow-2xl relative ${isSpinning ? 'animate-spin' : ''}`} style={{ animationDuration: isSpinning ? '0.5s' : '0s' }}>
              <Disc className="h-48 w-48 text-white/20 absolute" />
              <div className="z-10 flex flex-col items-center">
                {spinResult !== null ? (
                  <div className="animate-bounce">
                    <p className="text-5xl font-black text-white">{spinResult > 0 ? `+${spinResult}` : "😢"}</p>
                    <p className="text-xs font-bold text-white/80 uppercase tracking-widest mt-1">{spinResult > 0 ? "BCoins!" : "No Luck"}</p>
                  </div>
                ) : (
                  <Sparkles className="h-16 w-16 text-white animate-pulse" />
                )}
              </div>
              {/* Wheel segments decoration */}
              <div className="absolute inset-0 rounded-full border-4 border-white/10 pointer-events-none" />
            </div>
            {/* Pointer */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-8 bg-primary rounded-b-full shadow-lg z-20" />
          </div>

          <div className="max-w-xs space-y-4">
            <h2 className="text-2xl font-black text-foreground">Try Your Luck!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Spin the wheel once a day for a chance to win up to <span className="text-primary font-bold">10 BCoins</span>!
            </p>
            
            <div className="bg-muted/50 rounded-2xl p-4 grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-tighter">
              <div className="flex items-center gap-1.5 text-muted-foreground"><div className="w-2 h-2 rounded-full bg-muted" /> 70% Better Luck</div>
              <div className="flex items-center gap-1.5 text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500" /> 15% 1 BCoin</div>
              <div className="flex items-center gap-1.5 text-blue-500"><div className="w-2 h-2 rounded-full bg-blue-500" /> 8% 2 BCoins</div>
              <div className="flex items-center gap-1.5 text-purple-500"><div className="w-2 h-2 rounded-full bg-purple-500" /> 5% 3 BCoins</div>
              <div className="flex items-center gap-1.5 text-orange-500 col-span-2 justify-center"><Trophy className="h-3 w-3" /> 2% 10 BCoins!</div>
            </div>

            <Button 
              onClick={handleSpin} 
              disabled={!canSpin || isSpinning || checkingSpin} 
              className="w-full h-14 rounded-2xl font-black text-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
            >
              {isSpinning ? "SPINNING..." : canSpin ? "SPIN NOW!" : "COME BACK TOMORROW"}
            </Button>
            
            {!canSpin && !isSpinning && !checkingSpin && (
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Next spin available in 24 hours</p>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── MAIN VIEW ───
  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-6 w-6 text-warning" />
          <h1 className="font-extrabold text-lg">BCoins</h1>
        </div>

        <div className="bg-gradient-to-br from-warning/20 to-primary/10 rounded-2xl p-5 border border-warning/20 mb-4 text-center shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
          <p className="text-4xl font-black text-warning">{Number(wallet?.balance || 0).toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">BCoins</p>
        </div>

        <BCoinsFeatures activeSection={activeSection} onSectionChange={setActiveSection} />

        <div className="mt-6">
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-400/10 rounded-2xl border border-orange-200/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">Daily Login Rewards</h3>
                  <p className="text-[10px] text-muted-foreground">Day {dailyLogin.currentDay} of 7</p>
                </div>
              </div>
              {canClaimDaily && <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600 animate-pulse">READY</span>}
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {DAILY_REWARDS.map((reward, idx) => {
                const day = idx + 1;
                const isClaimed = day < dailyLogin.currentDay;
                const isToday = day === dailyLogin.currentDay;
                return (
                  <div key={day} className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-center border transition-all ${
                    isClaimed ? "bg-green-100 border-green-200 opacity-60" : 
                    isToday ? "bg-orange-100 border-orange-400 shadow-sm scale-105" : 
                    "bg-muted/50 border-border opacity-40"
                  }`}>
                    <span className="text-[8px] font-bold text-muted-foreground">D{day}</span>
                    <span className={`text-xs font-black ${isClaimed ? "text-green-600" : isToday ? "text-orange-600" : "text-muted-foreground"}`}>
                      {isClaimed ? "✓" : `+${reward}`}
                    </span>
                  </div>
                );
              })}
            </div>

            <Button 
              onClick={handleDailyClaim} 
              disabled={!canClaimDaily || claimingDaily} 
              className="w-full h-11 font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white shadow-md"
            >
              {claimingDaily ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
              {canClaimDaily ? `Claim Day ${dailyLogin.currentDay} Reward` : "Come back tomorrow"}
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Transaction History</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
              <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      (tx.amount || 0) > 0 ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {(tx.amount || 0) > 0 ? (
                        <ArrowDownCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground capitalize truncate">{(tx.type || "").replace("_", " ")}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{tx.description || ""}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-black ${(tx.amount || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
                      {(tx.amount || 0) > 0 ? "+" : ""}{Number(tx.amount || 0).toFixed(1)}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-medium">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}