import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Smartphone, RefreshCw, Clock } from "lucide-react";
import { notifyAdminRedemption } from "@/lib/notifications";

export default function BCoinsTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "rejected">("all");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [amount, setAmount] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [minAmounts] = [
    { gcash: 50, bcoins: 500 },
    { gcash: 100, bcoins: 1000 },
    { gcash: 150, bcoins: 1500 },
    { gcash: 200, bcoins: 2000 },
  ];

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("bcoins_wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setWallet(data);
      });
    (supabase as any)
      .from("bcoins_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }: any) => setTransactions(data || []));
  }, [user]);

  const handleSubmit = async () => {
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
        service_fee: gcashFee,
        total: amount + gcashFee,
        gcash_number: gcashNumber,
        admin_gcash_number: GCASH_ADMIN_NUMBER,
        reference_number: refNo,
        status: "pending",
      }).select().single();

      if (error) throw error;
      setTransactions(prev => [data, ...prev]);

      const userName = `User ${user.email?.split("@")[0] || "Student"}`;
      notifyAdminRedemption(userName, amount);
      notifyCustomerBCoins(user.id, 1, "GCash transaction");

      toast({
        title: "Request Submitted! ✅",
        description: `Ref: ${refNo}. Send ₱${amount + gcashFee} to ${GCASH_ADMIN_NUMBER} (incl. ₱${gcashFee} fee). +1 BCoin earned!`,
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
          <Smartphone className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">GCash</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to access GCash services.</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
        <BottomNav />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="h-6 w-6 text-primary" />
          <h1 className="font-extrabold text-lg">GCash</h1>
        </div>

        {showForm && (
          <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
            <div>
              <label className="text-xs font-bold mb-1.5">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType("cash_in")}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all ${type === "cash_in" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <ArrowDownCircle className="h-4 w-4 inline mr-1" /> Cash In
                </button>
                <button
                  onClick={() => setType("cash_out")}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all ${type === "cash_out" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                 <ArrowUpCircle className="h-4 w-4 inline mr-1" /> Cash Out
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block">Amount (₱)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {minAmounts.map((opt) => (
                  <button
                    key={opt.gcash}
                    onClick={() => setAmount(opt.gcash)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${amount === opt.gcash ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    ₱{opt.gcash}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Or enter custom amount"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || null)}
                className="mt-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block">GCash Number</label>
              <Input
                type="tel"
                placeholder="09XXXXXXXXX"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="text-sm"
              />
            </div>

            <div className="bg-muted/30 rounded-xl p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-bold">₱{gcashFee}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span>Total to Pay</span>
                <span className="text-primary">₱{(amount ? amount + gcashFee : 0).toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={loading || !amount || !gcashNumber} className="w-full h-11 font-bold rounded-xl">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-bold text-sm mb-3">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {tx.type === "cash_in" ? (
                        <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--success))]" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-xs font-bold capitalize">{tx.type.replace("_", " ")}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tx.status === "completed" ? "bg-green-100 text-green-600" : tx.status === "rejected" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₱{Number(tx.amount).toFixed(2)} + ₱{Number(tx.service_fee).toFixed(2)} fee</span>
                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                  {tx.reference_number && (
                    <p className="text-[10px] text-muted-foreground mt-1">Ref: {tx.reference_number}</p>
                  )}
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