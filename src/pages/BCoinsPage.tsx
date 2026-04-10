import { useState, useEffect } from "react";
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

const statusIcon = {
  pending: <Clock className="h-4 w-4 text-warning" />,
  completed: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
  rejected: <XCircle className="h-4 w-4 text-destructive" />,
};

// Robust retry wrapper with exponential backoff for lock conflicts
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isLockError = error?.message?.includes('lock') || 
                         error?.message?.includes('steal') || 
                         error?.name === 'AbortError' ||
                         error?.code === '40P01';
      
      if (isLockError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
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

  // BizMon Arena state
  const [showBizMon, setShowBizMon] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: w } = await (supabase as any).from("bcoins_wallets").select("*").eq("user_id", user.id).maybeSingle();
      setWallet(w);
      const { data: t } = await (supabase as any).from("bcoins_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      setTransactions(t || []);
    } catch (e) {
      console.error("BCoinsPage loadData error:", e);
    }
    setLoading(false);
  };

  // Initialize Daily Login with error handling
  useEffect(() => {
    if (!user) return;
    
    try {
      const stored = localStorage.getItem(`bcoins_daily_${user.id}`);
      const now = new Date();
      
      if (stored) {
        let parsed: DailyLoginState;
        try {
          parsed = JSON.parse(stored);
        } catch (parseError) {
          console.error("Failed to parse daily login state:", parseError);
          const newState: DailyLoginState = {
            lastClaim: null,
            currentDay: 1,
            cycleStart: now.toISOString(),
          };
          setDailyLogin(newState);
          localStorage.setItem(`bcoins_daily_${user.id}`, JSON.stringify(newState));
          setCanClaimDaily(true);
          return;
        }
        
        const cycleStart = new Date(parsed.cycleStart);
        if (isNaN(cycleStart.getTime())) {
          throw new Error("Invalid cycleStart date");
        }
        
        const daysSinceCycle = Math.floor((now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceCycle >= 7) {
          const newState: DailyLoginState = {
            lastClaim: null,
            currentDay: 1,
            cycleStart: now.toISOString(),
          };
          setDailyLogin(newState);
          localStorage.setItem(`bcoins_daily_${user.id}`, JSON.stringify(newState));
          setCanClaimDaily(true);
        } else {
          setDailyLogin(parsed);
          
          if (parsed.lastClaim) {
            const lastClaimDate = new Date(parsed.lastClaim);
            const hoursSinceClaim = (now.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);
            setCanClaimDaily(hoursSinceClaim >= 24 && parsed.currentDay <= 7);
          } else {
            setCanClaimDaily(true);
          }
        }
      } else {
        const newState: DailyLoginState = {
          lastClaim: null,
          currentDay: 1,
          cycleStart: now.toISOString(),
        };
        setDailyLogin(newState);
        localStorage.setItem(`bcoins_daily_${user.id}`, JSON.stringify(newState));
        setCanClaimDaily(true);
      }
    } catch (error) {
      console.error("Daily login initialization error:", error);
      const now = new Date();
      const safeState: DailyLoginState = {
        lastClaim: null,
        currentDay: 1,
        cycleStart: now.toISOString(),
      };
      setDailyLogin(safeState);
      setCanClaimDaily(true);
    }
  }, [user]);

  useEffect(() => { 
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("bcoins-wallet")
      .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_wallets", filter: `user_id=eq.${user.id}` },
        (payload: any) => { 
          if (payload.new) {
            setWallet(payload.new);
          }
        })
      .subscribe();
    return () => { 
      if (channel) supabase.removeChannel(channel); 
    };
  }, [user]);

  const handleDailyClaim = async () => {
    if (!user || !canClaimDaily || claimingDaily) return;
    
    setClaimingDaily(true);
    try {
      const reward = DAILY_REWARDS[dailyLogin.currentDay - 1] || 0.5;
      let calculatedNewBalance: number;
      
      await withRetry(async () => {
        const { data: currentWallet } = await (supabase as any)
          .from("bcoins_wallets")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();
        
        const currentBalance = Number(currentWallet?.balance || 0);
        calculatedNewBalance = currentBalance + reward;

        if (currentWallet) {
          await (supabase as any)
            .from("bcoins_wallets")
            .update({ balance: calculatedNewBalance, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } else {
          await (supabase as any)
            .from("bcoins_wallets")
            .insert({ user_id: user.id, balance: calculatedNewBalance });
        }

        await (supabase as any).from("bcoins_transactions").insert({
          user_id: user.id,
          amount: reward,
          type: "daily_login",
          description: `Day ${dailyLogin.currentDay} daily login reward`,
        });
      });

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
      
      setWallet(prev => prev ? { ...prev, balance: calculatedNewBalance } : { balance: calculatedNewBalance });
      
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

  const handleRedeem = async () => {
    if (!selectedRedeem || !gcashNumber.trim() || !user || !wallet) return;
    const option = REDEEM_OPTIONS.find((o) => o.gcash === selectedRedeem);
    if (!option) return;

    if (gcashNumber.length !== 11) {
      toast({ title: "Invalid Number", description: "Enter a valid 11-digit GCash number.", variant: "destructive" });
      return;
    }
    if (Number(wallet.balance) < option.bcoins) {
      toast({ title: "Insufficient BCoins", description: `You need ${option.bcoins} BCoins but only have ${Number(wallet.balance).toFixed(1)}.`, variant: "destructive" });
      return;
    }

    setRedeeming(true);
    try {
      await withRetry(async () => {
        const { data: currentWallet, error: fetchError } = await (supabase as any)
          .from("bcoins_wallets")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        if (!currentWallet) throw new Error("Wallet not found");

        const currentBalance = Number(currentWallet.balance);
        const newBalance = currentBalance - option.bcoins;

        if (newBalance < 0) throw new Error("Insufficient balance after recalculation");

        const { error: updateError } = await (supabase as any)
          .from("bcoins_wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (updateError) throw updateError;

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
      });

      const userName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
      notifyAdminRedemption(userName, option.gcash);
      toast({ title: "Redemption Submitted! 🎉", description: `₱${option.gcash} GCash will be sent to ${gcashNumber} after admin approval.` });
      setSelectedRedeem(null);
      setGcashNumber("");
      loadData();
    } catch (e: any) {
      console.error("Redemption error:", e);
      toast({ title: "Error", description: e.message || "Failed to process redemption", variant: "destructive" });
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

  // Safe balance display
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
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedRedeem === opt.gcash
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <p className="font-bold text-sm text-foreground">₱{opt.gcash}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.bcoins} BCoins</p>
                  </button>
                ))}
              </div>

              {selectedRedeem && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Input
                    type="tel"
                    placeholder="GCash Number (09XXXXXXXXX)"
                    value={gcashNumber}
                    onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    className="text-sm"
                  />
                  <Button onClick={handleRedeem} disabled={redeeming || !gcashNumber} className="w-full h-11 font-bold rounded-xl">
                    {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {redeeming ? "Processing..." : "Redeem Now"}
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
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          (tx.amount || 0) > 0 ? "bg-[hsl(var(--success))]/10" : "bg-destructive/10"
                        }`}>
                          {(tx.amount || 0) > 0 ? (
                            <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--success))]" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground capitalize">{(tx.type || "").replace("_", " ")}</p>
                          <p className="text-[10px] text-muted-foreground">{tx.description || ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${(tx.amount || 0) > 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
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

function DailyLoginCard({ onClaim, canClaim, currentDay, lastClaim }: { onClaim: () => void; canClaim: boolean; currentDay: number; lastClaim: string | null }) {
  const todayReward = DAILY_REWARDS[currentDay - 1] || 0;
  
  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-amber-400/10 rounded-2xl border border-orange-200/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-md">
            <CalendarCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">Daily Login Rewards</h3>
            <p className="text-[10px] text-muted-foreground">Claim up to 4 BCoins in 7 days!</p>
          </div>
        </div>
        {canClaim && (
          <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600 animate-pulse">
            READY
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {DAILY_REWARDS.map((reward, idx) => {
          const day = idx + 1;
          const isClaimed = day < currentDay || (day === currentDay && lastClaim !== null && canClaim === false);
          const isToday = day === currentDay;
          
          return (
            <div
              key={day}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg text-center transition-all ${
                isClaimed 
                  ? "bg-green-100 border border-green-200" 
                  : isToday 
                    ? "bg-orange-100 border-2 border-orange-400 shadow-sm" 
                    : "bg-muted/50 border border-border opacity-60"
              }`}
            >
              <span className="text-[8px] font-bold text-muted-foreground">Day {day}</span>
              <span className={`text-xs font-extrabold ${isClaimed ? "text-green-600" : isToday ? "text-orange-600" : "text-muted-foreground"}`}>
                {isClaimed ? "✓" : `+${reward}`}
              </span>
              {isToday && canClaim && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping" />
              )}
            </div>
          );
        })}
      </div>

      {canClaim ? (
        <Button onClick={onClaim} className="w-full h-10 font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white shadow-md">
          <Gift className="h-4 w-4 mr-2" />
          Claim +{todayReward} BCoins
        </Button>
      ) : lastClaim ? (
        <div className="text-center py-2 bg-muted/30 rounded-lg">
          <p className="text-[10px] text-muted-foreground">
            ✅ Claimed today! Come back tomorrow for Day {Math.min(currentDay + 1, 7)}
          </p>
        </div>
      ) : (
        <Button onClick={onClaim} className="w-full h-10 font-bold rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500 text-white shadow-md">
          <Gift className="h-4 w-4 mr-2" />
          Claim Day {currentDay} Reward (+{todayReward})
        </Button>
      )}
    </div>
  );
}

function EdGamesSection({ onPlayBizMon }: { onPlayBizMon: () => void }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">BCoins Ed-Games</h3>
            <p className="text-[10px] text-muted-foreground">Play & earn BCoins!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ED_GAMES.map((game) => {
          const isAvailable = game.status === "available";
          return (
            <div
              key={game.id}
              className={`relative bg-muted/30 rounded-xl p-3 border border-border ${
                isAvailable ? "cursor-pointer hover:bg-muted/50 transition-colors" : "opacity-70 cursor-not-allowed"
              }`}
              onClick={isAvailable ? onPlayBizMon : undefined}
            >
              {!isAvailable && (
                <div className="absolute top-2 right-2">
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    🔒
                  </span>
                </div>
              )}
              <div className="text-2xl mb-1.5">{game.emoji}</div>
              <h4 className="font-bold text-xs text-foreground">{game.title}</h4>
              <p className="text-[9px] text-muted-foreground line-clamp-1">{game.desc}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star className="h-3 w-3 text-warning fill-warning" />
                <span className="text-[9px] font-bold text-warning">Earn {game.reward}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}