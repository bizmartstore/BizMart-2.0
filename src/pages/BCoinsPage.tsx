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
  const { user, profile } = useAuth();               // ✅ Get profile
  const { toast } = useToast();
  const { gcacheFee } = useAppSettings();           // ✅ make sure useAppSettings is imported
  const [type, setType] = useState<"cash_in" | "cash_out">("cash_in");
  const [amount, setAmount] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (user) {
      (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }: any) => setBcoins(data?.balance || 0));
      (supabase as any)
        .from("bcoins_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30)
        .then(({ data }: any) => setTransactions(data || []));
    }
  }, [user]);

  const handleRedeem = async () => {
    if (!amount || !gcashNumber.trim() || !user) return;
    if (gcashNumber.length !== 11) {
      toast({ title: "Invalid Number", description: "Enter a valid 11-digit GCash number.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const refNo = `GC-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await (supabase as any).from("bcoins_transactions").insert({
        user_id: user.id,
        type,
        amount,
        service_fee: gcacheFee,
        total: amount + gcacheFee,
        gcash_number: gcashNumber,
        admin_gcash_number: GCASH_ADMIN_NUMBER,
        reference_number: refNo,
        status: "pending",
      }).select().single();

      if (error) throw error;
      setTransactions((prev) => [data, ...prev]);

      const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "User";
      notifyAdminRedemption(userName, amount);
      notifyCustomerBCoins(user.id, 1, "GCash transaction");

      toast({
        title: "Request Submitted! ✅",
        description: `Ref: ${refNo}. Send ₱${amount + gcacheFee} to ${GCASH_ADMIN_NUMBER} (incl. ₱${gcacheFee} fee). +1 BCoin earned!`,
      });
      setShowForm(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Coins className="h-16 w-16 text-[hsl(var(--warning))] mb-4" />
          <h2 className="font-extrabold text-lg mb-2">BCoins</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access BCoins.</p>
          <Button onClick={() => (window.location.href = "/login")}>Login</Button>
        </div>
        <BottomNav />
      </div>
    </div>
  );

  const balance = Number(profile?.balance || 0);

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
          <span className="font-bold text-xs mb-2">💡 How to Earn & Redeem</span>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p>🛒 <strong>Purchase products:</strong> ₱1.00 = 0.10 BCoins</p>
            <p>💰 <strong>GCash transactions:</strong> Earn 1 BCoin per Cash In/Out</p>
            <p>🎁 <strong>Redeem:</strong> 1000 BCoins = ₱100 GCash (max ₱200)</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["store", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {t === "store" ? "🎁 Redeem Store" : "📜 History"}
            </button>
          ))}          {tab === "store" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {REDEEM_OPTIONS.map((opt) => {
                const canAfford = balance >= opt.bcoins;
                return (
                  <button key={opt.bcoins} onClick={() => setSelectedRedeem(opt.bcoins)} disabled={!canAfford} className={`relative rounded-xl p-4 transition-all ${selectedRedeem === opt.bcoins ? "border-primary bg-primary/10" : canAfford ? "border-border bg-card hover:border-primary/50" : "border-border bg-muted/50 opacity-50"}>
                    <Smartphone className="h-6 w-6 mx-auto mb-1 text-[hsl(220,85%,55%)]" />
                    <div className="font-extrabold text-lg">₱{opt.bcoins}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground font-semibold">{opt.bcoins.toLocaleString()} BCoins</div>
                  </button>
                );
              })}
            </div>

            {selectedRedeem && (
              <div className="bg-card rounded-xl p-4 border border-border space-y-3">
                <span className="font-bold text-sm">Redeem ₱{selectedRedeem} GCash</span>
                <Input
                  placeholder="Your GCash Number (09XXXXXXXXX)"
                  value={gcashNumber}
                  onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="text-sm"
                />
                <div className="bg-muted/30 rounded-lg p-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">GCash Amount</span>
                    <span className="font-bold">₱{selectedRedeem} </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-bold text-sm">
                      {(balance - (REDEEM_OPTIONS.find((o) => o.bcoins === selectedRedeem)?.bcoins || 0)).toFixed(1)}
                    </span>
                  </div>
                </div>
                <Button onClick={handleRedeem} disabled={loading || !gcashNumber || gcashNumber.length !== 11} className="w-full">
                  {loading ? "Submitting..." : "Confirm Redemption"}
                </Button>
              </div>          }          {tab === "history" && (
            <div className="space-y-2">
              <h3 className="font-bold text-sm mb-3">Redemption Requests</h3>
              {transactions.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">No transactions yet</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-white" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs">₱{tx.amount.toFixed(2)}</span>
                        <span className="text-[10px] text-muted-foreground">BCoins</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gift className="h-4 w-4 text-white" />
                        <span className="text-[10px] text-muted-foreground">{tx.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              )}          </div>          <BottomNav />
        </div>
      </div>
    </div>
  );
}