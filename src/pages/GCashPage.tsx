import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Smartphone, ArrowDownCircle, ArrowUpCircle, Loader2, AlertCircle } from "lucide-react";
import { validatePhoneNumber, validateNumber } from "@/lib/validation";

export default function GCashPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<string>("");
  const [gcashNumber, setGcashNumber] = useState<string>("");
  const [type, setType] = useState<"cash_in" | "cash_out">("cash_in");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const { data: wallet } = await (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      setBalance(Number(wallet?.balance || 0));

      const { data: txs } = await (supabase as any)
        .from("gcash_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTransactions(txs || []);
    } catch (e) {
      console.error("Failed to load GCash data:", e);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !gcashNumber.trim() || !user) return;

    // Validate GCash number
    if (!validatePhoneNumber(gcashNumber)) {
      toast({ title: "Invalid Number", description: "Enter a valid 11-digit GCash number starting with 09.", variant: "destructive" });
      return;
    }

    // Validate amount
    const amountNum = Number(amount);
    const amountValidation = validateNumber(amountNum, 100, 10000);
    if (!amountValidation.valid) {
      toast({ title: "Invalid Amount", description: amountValidation.error || "Amount must be between ₱100 and ₱10,000", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: wallet } = await (supabase as any)
        .from("bcoins_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      const currentBalance = Number(wallet?.balance || 0);

      if (type === "cash_out" && currentBalance < amountNum) {
        toast({ title: "Insufficient BCoins", description: `You need ${amountNum} BCoins but only have ${currentBalance}.`, variant: "destructive" });
        setLoading(false);
        return;
      }

      const serviceFee = amountNum * 0.02; // 2% fee
      const total = amountNum + serviceFee;

      if (type === "cash_in") {
        // For cash in: user gets amount - fee (fee goes to admin)
        const netAmount = amountNum - serviceFee;
        await (supabase as any).from("bcoins_wallets").update({ balance: currentBalance + netAmount }).eq("user_id", user.id);
      } else {
        // For cash out: user loses amount + fee
        await (supabase as any).from("bcoins_wallets").update({ balance: currentBalance - total }).eq("user_id", user.id);
      }

      await (supabase as any).from("gcash_transactions").insert({
        user_id: user.id,
        type,
        amount: amountNum,
        service_fee: serviceFee,
        total,
        gcash_number: gcashNumber,
        status: "pending",
        admin_gcash_number: "09171234567", // Admin's GCash number
      });

      toast.success(`${type === "cash_in" ? "Cash In" : "Cash Out"} request submitted!`);
      setAmount("");
      setGcashNumber("");
      loadData();
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
          <Smartphone className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">GCash</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access GCash features.</p>
          <Button onClick={() => window.location.href = "/login"}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-6 w-6 text-primary" />
          <h1 className="font-extrabold text-lg">GCash</h1>
        </div>

        <div className="bg-gradient-to-br from-sky-500/10 to-blue-600/10 rounded-2xl p-5 border border-sky-200/30 mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">BCoins Balance</p>
          <p className="text-4xl font-extrabold text-primary">{balance.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground mt-1">BCoins</p>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setType("cash_in")}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                type === "cash_in" ? "bg-[hsl(var(--success))] text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              Cash In
            </button>
            <button
              onClick={() => setType("cash_out")}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                type === "cash_out" ? "bg-destructive text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              Cash Out
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold">Amount (₱)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="text-sm"
                min={100}
                max={10000}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {type === "cash_in" ? "You'll receive BCoins minus 2% fee" : "BCoins will be deducted plus 2% fee"}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold">GCash Number</label>
              <Input
                type="tel"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="09XXXXXXXXX"
                className="text-sm"
              />
            </div>
            <Button onClick={handleSubmit} disabled={loading || !amount || !gcashNumber} className="w-full h-11 font-bold rounded-xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : type === "cash_in" ? <ArrowDownCircle className="h-4 w-4 mr-2" /> : <ArrowUpCircle className="h-4 w-4 mr-2" />}
              {loading ? "Processing..." : type === "cash_in" ? "Cash In" : "Cash Out"}
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="font-bold text-sm mb-3">Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-2xl border border-dashed border-border">
              <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === "cash_in" ? "bg-[hsl(var(--success))]/10" : "bg-destructive/10"}`}>
                      {tx.type === "cash_in" ? <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--success))]" /> : <ArrowUpCircle className="h-4 w-4 text-destructive" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground capitalize">{tx.type.replace("_", " ")}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.gcash_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === "cash_in" ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                      {tx.type === "cash_in" ? "+" : "-"}₱{Number(tx.amount).toFixed(2)}
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      tx.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                      tx.status === 'pending' ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    }">{tx.status}</span>
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