import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Coins, ArrowDownCircle, ArrowUpCircle, Gift, Store, Gamepad2, Calendar, 
  CheckCircle2, Star, Lock, Play, ChevronRight, Flame, Award, Clock, Loader2 
} from "lucide-react";
import { notifyAdminRedemption, notifyCustomerBCoins } from "@/lib/notifications";

// Robust retry wrapper
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isLockError = error?.message?.includes('lock') || error?.name === 'AbortError' || error?.code === '40P01';
      if (isLockError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

const REDEEM_OPTIONS = [
  { gcash: 50, bcoins: 500 },
  { gcash: 100, bcoins: 1000 },
  { gcash: 200, bcoins: 2000 },
  { gcash: 500, bcoins: 5000 },
];

// Sample educational games (future-ready, not clickable yet)
const EDUCATIONAL_GAMES = [
  { id: 1, name: "Math Challenge", description: "Solve math problems to earn BCoins", icon: "🔢", reward: 5, color: "from-blue-500 to-cyan-500" },
  { id: 2, name: "Science Quiz", description: "Answer science questions correctly", icon: "🔬", reward: 5, color: "from-green-500 to-emerald-500" },
  { id: 3, name: "Word Puzzle", description: "Unscramble words to win BCoins", icon: "📝", reward: 3, color: "from-purple-500 to-pink-500" },
  { id: 4, name: "History Trivia", description: "Test your history knowledge", icon: "📜", reward: 4, color: "from-amber-500 to-orange-500" },
  { id: 5, name: "Geography Master", description: "Identify countries and capitals", icon: "🌍", reward: 4, color: "from-teal-500 to-blue-500" },
  { id: 6, name: "Logic Puzzles", description: "Solve brain teasers for BCoins", icon: "🧩", reward: 6, color: "from-indigo-500 to-purple-500" },
];

// Daily login streak rewards (max 4 BCoins on day 7)
const STREAK_REWARDS = [1, 1, 1, 1, 2, 2, 4]; // Day 1-7

export default function BCoinsPage() {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedeem, setSelectedRedeem] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [activeSection, setActiveSection] = useState<"store" | "games" | "login">("store");
  
  // Daily login states
  const [lastLoginDate, setLastLoginDate] = useState<string>("");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [todayClaimed, setTodayClaimed] = useState(false);
  const [claimingLogin, setClaimingLogin] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: w } = await (supabase as any).from("bcoins_wallets").select("*").eq("user_id", user.id).maybeSingle();
      setWallet(w);
      const { data: t } = await (supabase as any).from("bcoins_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setTransactions(t || []);
      
      // Load daily login data from localStorage
      const loginData = localStorage.getItem(`bcoins_login_${user.id}`);
      if (loginData) {
        const parsed = JSON.parse(loginData);
        setLastLoginDate(parsed.lastLoginDate || "");
        setCurrentStreak(parsed.currentStreak || 0);
        
        // Check if already claimed today
        const today = new Date().toDateString();
        setTodayClaimed(parsed.lastLoginDate === today);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("bcoins-wallet")
      .on("postgres_changes", { event: "*", schema: "public", table: "bcoins_wallets", filter: `user_id=eq.${user.id}` },
        (payload: any) => { if (payload.new) setWallet(payload.new); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

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

  const handleDailyLogin = async () => {
    if (!user || todayClaimed) return;
    
    setClaimingLogin(true);
    try {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      let newStreak = currentStreak;
      
      // Check if streak is broken
      if (lastLoginDate && lastLoginDate !== yesterday) {
        newStreak = 1; // Reset streak
      } else {
        newStreak = currentStreak + 1;
      }
      
      // Cap at 7 days
      if (newStreak > 7) newStreak = 7;
      
      // Get reward based on streak day
      const reward = STREAK_REWARDS[Math.min(newStreak - 1, 6)];
      
      // Update wallet
      await withRetry(async () => {
        const { data: currentWallet, error: fetchError } = await (supabase as any)
          .from("bcoins_wallets")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        if (!currentWallet) throw new Error("Wallet not found");

        const newBalance = Number(currentWallet.balance) + reward;
        
        const { error: updateError } = await (supabase as any)
          .from("bcoins_wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (updateError) throw updateError;

        // Record transaction
        await (supabase as any).from("bcoins_transactions").insert({
          user_id: user.id,
          amount: reward,
          type: "daily_login",
          description: `Daily login streak day ${newStreak} - earned ${reward} BCoins`,
        });
      });

      // Save login data
      const loginData = {
        lastLoginDate: today,
        currentStreak: newStreak,
      };
      localStorage.setItem(`bcoins_login_${user.id}`, JSON.stringify(loginData));
      
      setLastLoginDate(today);
      setCurrentStreak(newStreak);
      setTodayClaimed(true);
      
      toast({ 
        title: `Day ${newStreak} Streak! 🔥`, 
        description: `You earned ${reward} BCoins! ${newStreak === 7 ? "Max streak reached! Come back tomorrow to restart." : ""}` 
      });
      
      loadData();
    } catch (e: any) {
      console.error("Daily login error:", e);
      toast({ title: "Error", description: e.message || "Failed to claim daily login", variant: "destructive" });
    }
    setClaimingLogin(false);
  };

  // Check if can claim today (reset at midnight)
  useEffect(() => {
    if (!user) return;
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
      setTodayClaimed(false);
    }
  }, [user, lastLoginDate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Coins className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">BCoins</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access BCoins features.</p>
          <Button onClick={() => window.location.href = "/login"}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Feature buttons configuration
  const features = [
    { 
      id: "store", 
      label: "BCoins Store", 
      desc: "Redeem for GCash", 
      icon: Store, 
      bg: "bg-gradient-to-br from-emerald-500 to-teal-500",
      emoji: "🏪",
      active: activeSection === "store"
    },
    { 
      id: "games", 
      label: "BCoins Ed-Games", 
      desc: "Play & Earn", 
      icon: Gamepad2, 
      bg: "bg-gradient-to-br from-purple-500 to-pink-500",
      emoji: "🎮",
      active: activeSection === "games"
    },
    { 
      id: "login", 
      label: "Daily Login", 
      desc: `Day ${currentStreak}/7 Streak`, 
      icon: Calendar, 
      bg: "bg-gradient-to-br from-orange-500 to-amber-500",
      emoji: "📅",
      active: activeSection === "login"
    },
  ];

  // Duplicate for seamless infinite scroll
  const duplicatedFeatures = [...features, ...features];

  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 3);
  const hasMoreTransactions = transactions.length > 3;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-6 w-6 text-warning" />
          <h1 className="font-extrabold text-lg">BCoins</h1>
        </div>

        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-warning/20 via-yellow-500/10 to-primary/10 rounded-2xl p-5 border border-warning/20 mb-6 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="h-5 w-5 text-warning" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available Balance</p>
          </div>
          <p className="text-4xl font-extrabold text-warning mb-1">{wallet ? Number(wallet.balance).toFixed(1) : "0.0"}</p>
          <p className="text-xs text-muted-foreground">BCoins</p>
        </div>

        {/* Horizontal Scrolling Features */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <span className="font-extrabold text-sm uppercase tracking-wide text-secondary">BCoins Features</span>
          </div>
          <div 
            className="flex gap-3 overflow-x-auto scrollbar-hide"
            style={{
              animation: "marquee 25s linear infinite",
              scrollBehavior: "smooth"
            }}
            onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
            onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
          >
            {duplicatedFeatures.map((f, idx) => (
              <button
                key={`${f.id}-${idx}`}
                onClick={() => setActiveSection(f.id as "store" | "games" | "login")}
                className={`flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-[0.93] transition-transform p-3 rounded-2xl border-2 ${
                  f.active 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className={`${f.bg} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-b-full" />
                  <span className="text-2xl relative z-10">{f.emoji}</span>
                </div>
                <span className="text-[10px] font-bold text-foreground leading-tight text-center w-20">
                  {f.label}
                </span>
                <span className="text-[9px] text-muted-foreground text-center w-20">{f.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Section Content */}
        {activeSection === "store" && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm">BCoins Store</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
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
                  {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowDownCircle className="h-4 w-4 mr-2" />}
                  {redeeming ? "Processing..." : "Redeem Now"}
                </Button>
              </div>
            )}
          </div>
        )}

        {activeSection === "games" && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm">BCoins Ed-Games</h2>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4">
              Play educational games to earn BCoins! Complete challenges and quizzes to boost your balance.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {EDUCATIONAL_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="relative bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 border border-border cursor-not-allowed opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="absolute top-2 right-2">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-2`}>
                    <span className="text-xl">{game.icon}</span>
                  </div>
                  <h3 className="font-bold text-xs text-foreground mb-1">{game.name}</h3>
                  <p className="text-[10px] text-muted-foreground mb-2">{game.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-warning">+{game.reward} BCoins</span>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" disabled>
                      <Play className="h-3 w-3 mr-1" /> Play
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-[10px] text-muted-foreground text-center">
                🎮 These games are coming soon! Stay tuned for interactive learning experiences where you can earn BCoins while having fun.
              </p>
            </div>
          </div>
        )}

        {activeSection === "login" && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm">Daily Login Streak</h2>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-xl p-4 mb-4 text-center border border-orange-500/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-sm font-bold text-foreground">Current Streak</span>
              </div>
              <p className="text-3xl font-extrabold text-orange-500 mb-1">{currentStreak} / 7</p>
              <p className="text-[10px] text-muted-foreground">
                {todayClaimed 
                  ? "✓ Claimed today! Come back tomorrow." 
                  : currentStreak === 7 
                    ? "Max streak! Claim now to restart." 
                    : `Login daily to earn up to ${STREAK_REWARDS[6]} BCoins on day 7!`
                }
              </p>
            </div>

            {/* Streak calendar */}
            <div className="flex justify-between mb-4 px-2">
              {STREAK_REWARDS.map((reward, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    idx + 1 <= currentStreak
                      ? "bg-gradient-to-br from-orange-500 to-amber-500"
                      : "bg-muted"
                  }`}>
                    {idx + 1 <= currentStreak ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{idx + 1}</span>
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground">{reward} B</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleDailyLogin}
              disabled={claimingLogin || todayClaimed}
              className="w-full h-12 font-bold rounded-xl"
            >
              {claimingLogin ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : todayClaimed ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <Award className="h-4 w-4 mr-2" />
              )}
              {claimingLogin 
                ? "Claiming..." 
                : todayClaimed 
                  ? "Already Claimed Today" 
                  : `Claim ${STREAK_REWARDS[Math.min(currentStreak, 6)]} BCoins`
              }
            </Button>

            <p className="text-[10px] text-muted-foreground text-center mt-3">
              ⏰ Reset at midnight. Miss a day and your streak starts over!
            </p>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Transaction History</h3>
            {transactions.length > 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="h-8 text-xs gap-1"
              >
                {showAllTransactions ? (
                  <>Show Less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>See More <ChevronDown className="h-3 w-3" /></>
                )}
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-dashed border-border">
              <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedTransactions.map((tx) => (
                <div key={tx.id} className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {tx.amount > 0 ? (
                        <ArrowDownCircle className="h-5 w-5 text-[hsl(var(--success))]" />
                      ) : (
                        <ArrowUpCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-bold text-xs capitalize">
                          {tx.type.replace("_", " ")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {tx.description}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      tx.amount > 0 ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {tx.amount > 0 ? "+" : ""}{Number(tx.amount).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                    <span>{new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
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