import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Coins, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, 
  Loader2, Gift, AlertCircle, Calendar, Star, Gamepad2, Store, Trophy 
} from "lucide-react";
import { notifyAdminRedemption } from "@/lib/notifications";
import BCoinsFeatures from "@/components/BCoinsFeatures";

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

const REDEEM_OPTIONS = [
  { gcash: 50, bcoins: 500 },
  { gcash: 100, bcoins: 1000 },
  { gcash: 200, bcoins: 2000 },
  { gcash: 500, bcoins: 5000 },
];

// Sample educational games (future-ready, not clickable yet)
const SAMPLE_GAMES = [
  {
    id: "math-challenge",
    title: "Math Challenge",
    description: "Solve math problems to earn BCoins",
    reward: "10-50 BCoins per game",
    image: "🧮",
    status: "coming-soon"
  },
  {
    id: "word-puzzle",
    title: "Word Puzzle",
    description: "Unscramble words and earn rewards",
    reward: "15-40 BCoins per puzzle",
    image: "📝",
    status: "coming-soon"
  },
  {
    id: "science-quiz",
    title: "Science Quiz",
    description: "Test your science knowledge",
    reward: "20-60 BCoins per quiz",
    image: "🔬",
    status: "coming-soon"
  },
  {
    id: "history-trivia",
    title: "History Trivia",
    description: "Learn history while earning",
    reward: "10-30 BCoins per trivia",
    image: "📚",
    status: "coming-soon"
  },
];

export default function BCoinsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedeem, setSelectedRedeem] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [activeSection, setActiveSection] = useState<"store" | "edgames" | "daily-login" | null>(null);
  const [loginStreak, setLoginStreak] = useState<any[]>([]);
  const [claimingLogin, setClaimingLogin] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Check if wallet exists, create if not
      let walletData = await (supabase as any)
        .from("bcoins_wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (!walletData) {
        const { data: newWallet } = await (supabase as any)
          .from("bcoins_wallets")
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();
        walletData = newWallet;
      }
      
      const [t, streak] = await Promise.all([
        (supabase as any).from("bcoins_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        (supabase as any).from("daily_login_claims").select("*").eq("user_id", user.id).order("claim_date", { ascending: false }).limit(7)
      ]);
      
      setWallet(walletData);
      setTransactions(t || []);
      setLoginStreak(streak || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [user, loadData]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("bcoins-wallet")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "bcoins_wallets", filter: `user_id=eq.${user.id}` },
        (payload: any) => { if (payload.new) setWallet(payload.new); }
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "bcoins_transactions", filter: `user_id=eq.${user.id}` },
        () => loadData()
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "daily_login_claims", filter: `user_id=eq.${user.id}` },
        () => loadData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadData]);

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

  // Compute weekly stats for daily login
  const weeklyStats = useMemo(() => {
    if (loginStreak.length === 0) {
      return { totalEarned: 0, daysClaimed: 0, maxDays: 7, maxBCoins: 4, hasClaimedToday: false, todayReward: 0.5, weekClaims: [] };
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(now);
    const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(monday.getDate() - dayOffset);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekClaims = loginStreak.filter((claim: any) => {
      const claimDate = new Date(claim.claim_date);
      return claimDate >= monday && claimDate <= sunday;
    });

    const today = new Date().toISOString().split('T')[0];
    const hasClaimedToday = weekClaims.some((claim: any) => claim.claim_date === today);
    const weekClaimsExcludingToday = weekClaims.filter((claim: any) => claim.claim_date !== today);
    
    const totalEarned = weekClaims.reduce((sum: number, claim: any) => sum + Number(claim.bcoins_earned), 0);
    const daysClaimed = weekClaims.length;
    
    // Calculate today's potential reward if not claimed
    // First 6 claims: 0.5 BCoins each, 7th claim: 1 BCoin (total max 4)
    let todayReward = 0.5;
    if (weekClaimsExcludingToday.length >= 6) {
      todayReward = 1;
    }
    // Ensure we don't exceed weekly max
    if (totalEarned + todayReward > 4) {
      todayReward = Math.max(0, 4 - totalEarned);
    }

    return {
      totalEarned,
      daysClaimed,
      maxDays: 7,
      maxBCoins: 4,
      hasClaimedToday,
      todayReward,
      weekClaims
    };
  }, [loginStreak]);

  const handleDailyLogin = async () => {
    if (!user || !wallet) return;
    
    if (weeklyStats.hasClaimedToday) {
      toast({ title: "Already Claimed", description: "You've already claimed your daily BCoins today!", variant: "destructive" });
      return;
    }

    if (weeklyStats.totalEarned >= weeklyStats.maxBCoins) {
      toast({ title: "Weekly Limit Reached", description: "You've earned the maximum 4 BCoins this week. Check back next week!", variant: "destructive" });
      return;
    }

    if (weeklyStats.todayReward <= 0) {
      toast({ title: "Weekly Limit", description: "No more BCoins available this week.", variant: "destructive" });
      return;
    }

    setClaimingLogin(true);
    try {
      await withRetry(async () => {
        const today = new Date().toISOString().split('T')[0];
        
        // Insert claim record
        const { error: claimError } = await (supabase as any)
          .from("daily_login_claims")
          .insert({
            user_id: user.id,
            claim_date: today,
            bcoins_earned: weeklyStats.todayReward,
          });
        if (claimError) throw claimError;

        // Update wallet balance
        const { data: currentWallet, error: fetchError } = await (supabase as any)
          .from("bcoins_wallets")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        const newBalance = Number(currentWallet?.balance || 0) + weeklyStats.todayReward;
        const { error: updateError } = await (supabase as any)
          .from("bcoins_wallets")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (updateError) throw updateError;

        // Log transaction
        await (supabase as any).from("bcoins_transactions").insert({
          user_id: user.id,
          amount: weeklyStats.todayReward,
          type: "daily_login",
          description: `Daily login reward (Day ${weeklyStats.daysClaimed + 1} of week)`,
        });
      });

      toast({ 
        title: "BCoins Claimed! 🎉", 
        description: `You earned ${weeklyStats.todayReward} BCoins! ${weeklyStats.totalEarned + weeklyStats.todayReward >= weeklyStats.maxBCoins ? 'Weekly maximum reached!' : ''}` 
      });
      loadData();
    } catch (e: any) {
      console.error("Daily login error:", e);
      toast({ title: "Error", description: e.message || "Failed to claim daily BCoins", variant: "destructive" });
    }
    setClaimingLogin(false);
  };

  const handleFeatureClick = (featureId: string) => {
    if (featureId === "store") {
      setActiveSection("store");
    } else if (featureId === "edgames") {
      setActiveSection("edgames");
    } else if (featureId === "daily-login") {
      setActiveSection("daily-login");
    } else {
      toast({ title: "Coming Soon!", description: "This feature will be available in a future update.", variant: "default" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Coins className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">BCoins Wallet</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to view your BCoins.</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Coins className="h-6 w-6 text-warning" />
          <h1 className="font-extrabold text-lg">BCoins</h1>
        </div>

        {/* BCoins Features Carousel */}
        <BCoinsFeatures onFeatureClick={handleFeatureClick} />

        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-warning/20 via-primary/10 to-accent/20 rounded-2xl p-5 border border-warning/20 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Available Balance</p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-warning text-warning" />
              <span className="text-[10px] font-bold text-warning">Earn More</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-extrabold text-warning">{wallet ? Number(wallet.balance).toFixed(1) : "0.0"}</p>
            <span className="text-lg font-bold text-warning/70">BCoins</span>
          </div>
          
          {/* Weekly Progress */}
          <div className="mt-4 bg-warning/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-muted-foreground">Weekly Progress</span>
              <span className="text-[10px] font-bold text-warning">{weeklyStats.totalEarned.toFixed(1)}/4 BCoins</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    i < weeklyStats.daysClaimed
                      ? "bg-gradient-to-r from-warning to-orange-400"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 text-center">
              {weeklyStats.daysClaimed}/7 days claimed this week
            </p>
          </div>
        </div>

        {/* Dynamic Content Sections */}
        {activeSection === "store" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-sm">BCoins Store</h2>
              </div>
              
              <p className="text-xs text-muted-foreground mb-4">
                Redeem your BCoins for GCash cash! Select an amount below.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {REDEEM_OPTIONS.map((opt) => (
                  <button
                    key={opt.gcash}
                    onClick={() => setSelectedRedeem(opt.gcash)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedRedeem === opt.gcash
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-muted/30 hover:bg-muted/50"
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
                  <Button 
                    onClick={handleRedeem} 
                    disabled={redeeming || !gcashNumber} 
                    className="w-full h-11 font-bold rounded-xl bg-primary"
                  >
                    {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
                    {redeeming ? "Processing..." : "Redeem Now"}
                  </Button>
                </div>
              )}

              {!selectedRedeem && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  Select an amount to redeem
                </p>
              )}
            </div>

            {/* Recent Redemptions */}
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-bold text-sm mb-3">Recent Redemptions</h3>
              {transactions.filter(tx => tx.type === 'redeem_gcash').length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">No redemptions yet</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {transactions
                    .filter(tx => tx.type === 'redeem_gcash')
                    .slice(0, 5)
                    .map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-xs font-bold">₱{tx.gcash_amount} to {tx.gcash_number}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          tx.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                          tx.status === 'pending' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "edgames" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Gamepad2 className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-sm">BCoins Ed-Games</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Coming Soon</span>
              </div>
              
              <p className="text-xs text-muted-foreground mb-4">
                Play educational games and earn BCoins while you learn! These games will be available soon.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {SAMPLE_GAMES.map((game) => (
                  <div key={game.id} className="bg-muted/30 rounded-xl p-3 border border-border">
                    <div className="text-3xl mb-2 text-center">{game.image}</div>
                    <h3 className="font-bold text-xs text-center mb-1">{game.title}</h3>
                    <p className="text-[10px] text-muted-foreground text-center mb-2">{game.description}</p>
                    <div className="flex items-center justify-center gap-1">
                      <Gift className="h-3 w-3 text-warning" />
                      <span className="text-[10px] font-bold text-warning">{game.reward}</span>
                    </div>
                    <Button 
                      disabled 
                      className="w-full mt-2 h-8 text-[10px] font-bold bg-muted text-muted-foreground"
                    >
                      Coming Soon
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "daily-login" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-sm">Daily Login Rewards</h2>
              </div>
              
              <div className="bg-gradient-to-br from-warning/10 to-primary/5 rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-2 text-center">Claim your daily BCoins!</p>
                <div className="flex justify-center items-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-warning">{weeklyStats.daysClaimed}</p>
                    <p className="text-[9px] text-muted-foreground">Days Claimed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-primary">{weeklyStats.totalEarned.toFixed(1)}</p>
                    <p className="text-[9px] text-muted-foreground">BCoins Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-foreground">{weeklyStats.maxBCoins}</p>
                    <p className="text-[9px] text-muted-foreground">Weekly Max</p>
                  </div>
                </div>
                
                {/* Weekly progress bar */}
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-3 rounded-full transition-all ${
                        i < weeklyStats.daysClaimed
                          ? "bg-gradient-to-b from-warning to-orange-400"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {weeklyStats.daysClaimed < 7 
                    ? `${7 - weeklyStats.daysClaimed} days left to reach weekly max`
                    : "Weekly maximum reached! Check back next week."
                  }
                </p>
              </div>

              <Button
                onClick={handleDailyLogin}
                disabled={claimingLogin || weeklyStats.hasClaimedToday || weeklyStats.totalEarned >= weeklyStats.maxBCoins}
                className="w-full h-12 font-bold rounded-xl bg-gradient-to-r from-warning to-orange-500 hover:from-warning/90 hover:to-orange-500/90 disabled:opacity-50"
              >
                {claimingLogin ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : weeklyStats.hasClaimedToday ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                {claimingLogin ? "Claiming..." : 
                 weeklyStats.hasClaimedToday ? "Claimed Today ✓" : 
                 `Claim ${weeklyStats.todayReward} BCoins`}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center mt-3">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* Login History */}
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="font-bold text-sm mb-3">This Week's Claims</h3>
              {weeklyStats.weekClaims.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-4">No claims yet this week</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {weeklyStats.weekClaims.slice(0, 7).map((claim: any) => (
                    <div key={claim.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                        <div>
                          <p className="text-xs font-bold">+{Number(claim.bcoins_earned).toFixed(1)} BCoins</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(claim.claim_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[hsl(var(--success))] font-bold">Claimed</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Default Store View (when no section selected) */}
        {!activeSection && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-sm">Quick Redeem</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {REDEEM_OPTIONS.map((opt) => (
                  <button
                    key={opt.gcash}
                    onClick={() => setSelectedRedeem(opt.gcash)}
                    className="p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-all"
                  >
                    <p className="font-bold text-sm">₱{opt.gcash}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.bcoins} BCoins</p>
                  </button>
                ))}
              </div>

              {selectedRedeem && (
                <div className="space-y-3 animate-in fade-in">
                  <Input
                    type="tel"
                    placeholder="GCash Number (09XXXXXXXXX)"
                    value={gcashNumber}
                    onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    className="text-sm"
                  />
                  <Button 
                    onClick={handleRedeem} 
                    disabled={redeeming || !gcashNumber} 
                    className="w-full h-11 font-bold rounded-xl"
                  >
                    {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
                    {redeeming ? "Processing..." : "Redeem Now"}
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-xl p-3 border border-border text-center">
                <p className="text-lg font-extrabold text-primary">{transactions.filter(tx => tx.type === 'redeem_gcash' && tx.status === 'completed').length}</p>
                <p className="text-[10px] text-muted-foreground">Successful Redemptions</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border text-center">
                <p className="text-lg font-extrabold text-warning">{weeklyStats.daysClaimed}/7</p>
                <p className="text-[10px] text-muted-foreground">Days Claimed This Week</p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History (shown at bottom regardless of section) */}
        <div className="mt-6">
          <h3 className="font-bold text-sm mb-3">Recent Activity</h3>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-dashed border-border">
              <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.amount > 0 ? "bg-[hsl(var(--success))]/10" : "bg-destructive/10"
                    }`}>
                      {tx.type === 'redeem_gcash' ? <Gift className="h-4 w-4 text-primary" /> :
                       tx.amount > 0 ? <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--success))]" /> :
                       <ArrowUpCircle className="h-4 w-4 text-destructive" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground capitalize">
                        {tx.type === 'daily_login' ? 'Daily Login' :
                         tx.type === 'redeem_gcash' ? 'GCash Redemption' :
                         tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{tx.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.amount > 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                      {tx.amount > 0 ? "+" : ""}{Number(tx.amount).toFixed(1)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back button when section is active */}
        {activeSection && (
          <Button
            onClick={() => setActiveSection(null)}
            variant="outline"
            className="w-full mt-4 gap-2"
          >
            ← Back to BCoins Overview
          </Button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}