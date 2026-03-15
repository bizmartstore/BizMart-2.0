import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notifyAdminGCash, notifyCustomerBCoins } from "@/lib/notifications";

const GCASH_ADMIN_NUMBER = "09957656049";
const ALLOWED_AMOUNTS = [100, 150, 200, 250, 300, 350, 400, 450, 500];

type TransactionType = "cash_in" | "cash_out";

const statusIcon = {
  pending: <Clock className="h-4 w-4 text-warning" />,
  completed: <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />,
  rejected: <XCircle className="h-4 w-4 text-destructive" />,
};

export default function GCashPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { gcashFee } = useAppSettings();
  const [type, setType] = useState<TransactionType>("cash_in");
  const [amount, setAmount] = useState<number | null>(null);
  const [gcashNumber, setGcashNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (user) {
      (supabase as any)
        .from("gcash_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }: any) => setTransactions(data || []));
    }
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
      const { data, error } = await (supabase as any)
        .from("gcash_transactions")
        .insert({
          user_id: user.id,
          type,
          amount,
          service_fee: gcashFee,
          total: amount + gcashFee,
          gcash_number: gcashNumber,
          admin_gcash_number: GCASH_ADMIN_NUMBER,
          reference_number: refNo,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      setTransactions((prev) => [data, ...prev]);

      // Award 1 BCoin for every GCash transaction
      try {
        const { data: wallet } = await (supabase as any)
          .from("bcoins_wallets")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (wallet) {
          await (supabase as any)
            .from("bcoins_wallets")
            .update({ balance: Number(wallet.balance) + 1, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } else {
          await (supabase as any)
            .from("bcoins_wallets")
            .insert({ user_id: user.id, balance: 1 });
        }

        await (supabase as any)
          .from("bcoins_transactions")
          .insert({
            user_id: user.id,
            amount: 1,
            type: "earn_gcash",
            description: `GCash ${type === "cash_in" ? "Cash In" : "Cash Out"} - ₱${amount}`,
          });
      } catch {}

      // Send push notification to admins
      const userName = `User ${user.email?.split("@")[0] || "Student"}`;
      notifyAdminGCash(type, userName, amount);
      notifyCustomerBCoins(user.id, 1, "GCash transaction");

      toast({
        title: "Request Submitted! ✅",
        description: `Ref: ${refNo}. Send ₱${amount + gcashFee} to ${GCASH_ADMIN_NUMBER} (incl. ₱${gcashFee} fee). +1 BCoin earned!`,
      });
      setShowForm(false);
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
          <Smartphone className="h-16 w-16 text-[hsl(220,85%,55%)] mb-4" />
          <h2 className="font-extrabold text-lg mb-2">GCash Services</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to use GCash services.</p>
          <Button onClick={() => window.location.href = "/login"}>Login to Continue</Button>
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
          <Smartphone className="h-6 w-6 text-[hsl(220,85%,55%)]" />
          <h1 className="font-extrabold text-lg">GCash Services</h1>
        </div>

        {/* Info banner */}
        <div className="bg-[hsl(220,85%,95%)] rounded-xl p-3 mb-4 border border-[hsl(220,85%,85%)]">
          <p className="text-[11px] text-[hsl(220,85%,35%)]">
            <strong>Admin GCash:</strong> {GCASH_ADMIN_NUMBER} • <strong>Service Fee:</strong> ₱{gcashFee}.00
          </p>
        </div>

        {showForm && (
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-4">
            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
              {(["cash_in", "cash_out"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    type === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t === "cash_in" ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                  {t === "cash_in" ? "Cash In" : "Cash Out"}
                </button>
              ))}
            </div>

            {/* Amount grid */}
            <label className="text-xs font-bold text-muted-foreground mb-2 block">Select Amount</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {ALLOWED_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    amount === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  ₱{a}
                </button>
              ))}
            </div>

            {/* GCash Number */}
            <label className="text-xs font-bold text-muted-foreground mb-2 block">Your GCash Number</label>
            <Input
              placeholder="09XXXXXXXXX"
              value={gcashNumber}
              onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
              className="mb-3"
              type="tel"
            />

            {amount && (
              <div className="bg-muted rounded-xl p-3 mb-4 text-xs">
                <div className="flex justify-between"><span>Amount</span><span>₱{amount}.00</span></div>
                <div className="flex justify-between"><span>Service Fee</span><span>₱{gcashFee}.00</span></div>
                <div className="border-t border-border my-1.5" />
                <div className="flex justify-between font-bold"><span>Total</span><span>₱{amount + gcashFee}.00</span></div>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={loading || !amount || !gcashNumber} className="w-full">
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        )}

        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full mb-4" variant="outline">
            New Transaction
          </Button>
        )}

        {/* Transaction History */}
        <div className="mb-2">
          <span className="font-bold text-sm">Transaction History</span>
        </div>
        {transactions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No transactions yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                {tx.type === "cash_in" ? (
                  <ArrowDownCircle className="h-8 w-8 text-[hsl(var(--success))]" />
                ) : (
                  <ArrowUpCircle className="h-8 w-8 text-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs">{tx.type === "cash_in" ? "Cash In" : "Cash Out"} - ₱{tx.amount}</div>
                  <div className="text-[10px] text-muted-foreground">Ref: {tx.reference_number}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1">
                  {statusIcon[tx.status as keyof typeof statusIcon]}
                  <span className="text-[10px] font-semibold capitalize">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
