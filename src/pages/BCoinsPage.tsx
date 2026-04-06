import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Coins, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, Loader2, Gift, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { notifyAdminRedemption } from "@/lib/notifications";

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

const statusIcon = {
  pending: <Clock className="h-4 w-4 text-warning" />,
  completed: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
  rejected: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function BCoinsPage() {
  const { user, profile } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedeem, setSelectedRedeem] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: w } = await (supabase as any).from("bcoins_wallets").select("*").eq("user_id", user.id).maybeSingle();
      setWallet(w);
      const { data: t } = await (supabase as any).from("bcoins_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setTransactions(t || []);
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

  // Show only first 3 transactions when not expanded
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
        <div className="bg-gradient-to-br from-warning/20 to-primary/10 rounded-2xl p-5 border border-warning/20 mb-6 text-center">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
          <p className="text-4xl font-extrabold text-warning">{wallet ? Number(wallet.balance).toFixed(1) : "0.0"}</p>
          <p className="text-xs text-muted-foreground mt-1">BCoins</p>
        </div>

        {/* Redeem Section */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-sm">Redeem to GCash</h2>
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
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
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