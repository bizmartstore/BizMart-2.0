import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Gift, ArrowUpCircle, ArrowDownCircle, Clock, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { notifyAdminRedemption } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 1000 BCoins = ₱100 GCash, max ₱200
const REDEEM_OPTIONS = [
  { gcash: 50, bcoins: 500 },
  { gcash: 100, bcoins: 1000 },
  { gcash: 150, bcoins: 1500 },
  { gcash: 200, bcoins: 2000 },
];

const statusIcon = {
  pending: <Clock className="h-4 w-4 text-warning" />,
  completed: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
  rejected: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function BCoinsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [selectedRedeem, setSelectedRedeem] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"store" | "history">("store");

  const loadData = async () => {
    if (!user) return;
    const { data: w } = await (supabase as any).from("bcoins_wallets").select("*").eq("user_id", user.id).maybeSingle();
    if (w) { setWallet(w); } else {
      const { data: newW } = await (supabase as any).from("bcoins_wallets").insert({ user_id: user.id, balance: 0 }).select().single();
      setWallet(newW);
    }
    const { data: txns } = await (supabase as any).from("bcoins_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
    setTransactions(txns || []);
    const { data: reds } = await (supabase as any).from("bcoins_redemptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setRedemptions(reds || []);
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
    if (wallet.balance < option.bcoins) {
      toast({ title: "Insufficient BCoins", description: `You need ${option.bcoins} BCoins but only have ${Number(wallet.balance).toFixed(1)}.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await (supabase as any).from("bcoins_wallets").update({ balance: wallet.balance - option.bcoins, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      await (supabase as any).from("bcoins_transactions").insert({ user_id: user.id, amount: -option.bcoins, type: "redeem_gcash", description: `Redeemed ₱${option.gcash} GCash` });
      await (supabase as any).from("bcoins_redemptions").insert({ user_id: user.id, bcoins_amount: option.bcoins, gcash_amount: option.gcash, gcash_number: gcashNumber, status: "pending" });

      const userName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
      notifyAdminRedemption(userName, option.gcash);
      toast({ title: "Redemption Submitted! 🎉", description: `₱${option.gcash} GCash will be sent to ${gcashNumber} after admin approval.` });
      setSelectedRedeem(null);
      setGcashNumber("");
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Coins className="h-16 w-16 text-[hsl(var(--warning))] mb-4" />
          <h2 className="font-extrabold text-lg mb-2">BCoins Store</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access BCoins.</p>
          <Button onClick={() => (window.location.href = "/login")}>Login to Continue</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const balance = Number(wallet?.balance || 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-6 w-6 text-[hsl(var(--warning))]" />
          <h1 className="font-extrabold text-lg">BCoins</h1>
        </div>

        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-[hsl(var(--warning))] to-[hsl(35,95%,45%)] rounded-2xl p-5 text-primary-foreground shadow-lg mb-4">
          <div className="text-xs opacity-80 font-semibold mb-1">Your Balance</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold">{balance.toFixed(1)}</span>
            <span className="text-sm font-bold opacity-80">BCoins</span>
          </div>
        </div>

        {/* How to earn */}
        <div className="bg-card rounded-xl p-3 border border-border mb-4">
          <span className="font-bold text-xs block mb-2">💡 How to Earn & Redeem</span>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p>🛒 <strong>Purchase products:</strong> ₱1.00 = 0.10 BCoins</p>
            <p>💰 <strong>GCash transactions:</strong> Earn 1 BCoin per Cash In/Out</p>
            <p>🎁 <strong>Redeem:</strong> 1000 BCoins = ₱100 GCash (max ₱200)</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["store", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {t === "store" ? "🎁 Redeem Store" : "📜 History"}
            </button>
          ))}
        </div>

        {tab === "store" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {REDEEM_OPTIONS.map((opt) => {
                const canAfford = balance >= opt.bcoins;
                return (
                  <button key={opt.gcash} onClick={() => canAfford && setSelectedRedeem(opt.gcash)} disabled={!canAfford}
                    className={`relative rounded-xl p-4 border-2 transition-all text-center ${
                      selectedRedeem === opt.gcash ? "border-primary bg-primary/10" : canAfford ? "border-border bg-card hover:border-primary/50" : "border-border bg-muted/50 opacity-50"
                    }`}>
                    <Smartphone className="h-6 w-6 mx-auto mb-1 text-[hsl(220,85%,55%)]" />
                    <div className="font-extrabold text-lg">₱{opt.gcash}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">GCash</div>
                    <div className="mt-1 bg-[hsl(var(--warning))]/20 rounded-full px-2 py-0.5 inline-block">
                      <span className="text-[10px] font-bold text-[hsl(var(--warning))]">{opt.bcoins.toLocaleString()} BCoins</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedRedeem && (
              <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                <span className="font-bold text-sm">Redeem ₱{selectedRedeem} GCash</span>
                <Input placeholder="Your GCash Number (09XXXXXXXXX)" value={gcashNumber}
                  onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))} type="tel" />
                <div className="bg-muted rounded-lg p-2 text-xs">
                  <div className="flex justify-between"><span>GCash Amount</span><span>₱{selectedRedeem}.00</span></div>
                  <div className="flex justify-between"><span>BCoins Cost</span><span>{REDEEM_OPTIONS.find(o => o.gcash === selectedRedeem)?.bcoins.toLocaleString()} BCoins</span></div>
                  <div className="border-t border-border my-1" />
                  <div className="flex justify-between font-bold"><span>Remaining</span><span>{(balance - (REDEEM_OPTIONS.find(o => o.gcash === selectedRedeem)?.bcoins || 0)).toFixed(1)} BCoins</span></div>
                </div>
                <Button onClick={handleRedeem} disabled={loading || !gcashNumber || gcashNumber.length !== 11} className="w-full">
                  {loading ? "Submitting..." : "Confirm Redemption"}
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {redemptions.length > 0 && (
              <div className="mb-3">
                <span className="font-bold text-xs block mb-2">Redemption Requests</span>
                {redemptions.map((r) => (
                  <div key={r.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3 mb-1">
                    <Gift className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs">₱{r.gcash_amount} GCash</div>
                      <div className="text-[10px] text-muted-foreground">{r.bcoins_amount.toLocaleString()} BCoins • {r.gcash_number}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {statusIcon[r.status as keyof typeof statusIcon]}
                      <span className="text-[10px] font-semibold capitalize">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <span className="font-bold text-xs block mb-2">BCoins Transactions</span>
            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No transactions yet</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                  {Number(tx.amount) > 0 ? <ArrowDownCircle className="h-7 w-7 text-[hsl(var(--success))] flex-shrink-0" /> : <ArrowUpCircle className="h-7 w-7 text-destructive flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs">{tx.description}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>
                  </div>
                  <span className={`font-extrabold text-sm ${Number(tx.amount) > 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {Number(tx.amount) > 0 ? "+" : ""}{Number(tx.amount).toFixed(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
