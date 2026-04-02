import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShoppingCart, Printer, Plus, Minus, Trash2, Receipt, Search, X,
  DollarSign, TrendingUp, Users, Package, RefreshCw
} from "lucide-react";
import { sendNotification } from "@/lib/notifications";
import { useIsMobile } from "@/hooks/use-mobile";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sellerId?: string | null;
};

/* ────────── Product POS ────────── */
function ProductPOS({ role, onSaleComplete }: { role: string; onSaleComplete: () => void }) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("products").select("*").eq("is_active", true).order("name");
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), quantity: 1, image: product.image, sellerId: product.seller_id || null }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const mainAdminCommission = Number((subtotal * 0.10).toFixed(2));
  const memberAdminCommission = Number((subtotal * 0.10).toFixed(2));
  const sellerEarnings = Number((subtotal - mainAdminCommission - memberAdminCommission).toFixed(2));

  const completeSale = async () => {
    if (cart.length === 0) return;
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("pos_sales").insert({
        sale_type: "product",
        status: "completed",
        items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity, image: c.image })),
        subtotal,
        total: subtotal,
        main_admin_commission: mainAdminCommission,
        seller_earnings: sellerEarnings,
        member_admin_earnings: memberAdminCommission,
        sold_by: user.id,
      });

      if (error) throw error;

      toast.success(`Sale completed! ₱${subtotal.toFixed(2)}`);
      setCart([]);
      setCustomerName("");
      onSaleComplete();
    } catch (e: any) {
      console.error("POS sale error:", e);
      toast.error(e.message || "Failed to complete sale");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 text-xs h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={loadProducts} disabled={loading}>
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
        {filtered.map(p => (
          <button key={p.id} onClick={() => addToCart(p)}
            className="bg-card border border-border rounded-lg p-2 text-center hover:border-primary transition-colors active:scale-95">
            {p.image && <img src={p.image} className="h-10 w-10 rounded object-cover mx-auto mb-1" alt="" />}
            <p className="text-[10px] font-bold truncate">{p.name}</p>
            <p className="text-[10px] text-primary font-extrabold">₱{Number(p.price).toFixed(2)}</p>
          </button>
        ))}
        {filtered.length === 0 && !loading && (
          <p className="col-span-3 text-center text-[10px] text-muted-foreground py-8">No products found. Sync defaults in Products tab.</p>
        )}
      </div>

      {cart.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Cart ({cart.length})</span>
            <button onClick={() => setCart([])} className="text-[10px] text-destructive font-bold">Clear</button>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate font-medium">{item.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)} className="p-0.5 rounded bg-muted"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-0.5 rounded bg-muted"><Plus className="h-3 w-3" /></button>
                </div>
                <span className="font-bold text-primary w-14 text-right">₱{(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => removeItem(item.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
          <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="text-xs h-8" />
          <div className="bg-muted/50 rounded-lg p-2 space-y-0.5">
            <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Total</span><span className="font-bold">₱{subtotal.toFixed(2)}</span></div>
          </div>
          <Button onClick={completeSale} disabled={submitting} className="w-full gap-1 font-extrabold">
            <Receipt className="h-4 w-4" />
            {submitting ? "Processing..." : `Complete Sale — ₱${subtotal.toFixed(2)}`}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ────────── Print POS ────────── */
function PrintPOS({ role, onSaleComplete }: { role: string; onSaleComplete: () => void }) {
  const { user } = useAuth();
  const [bwPages, setBwPages] = useState(0);
  const [coloredPages, setColoredPages] = useState(0);
  const [pageSize, setPageSize] = useState<"short" | "a4" | "long">("short");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const PRICING = {
    bw: { short: 3.0, a4: 3.0, long: 5.0 },
    colored: { short: 8.0, a4: 8.0, long: 10.0 },
  };

  const totalCost = (bwPages * PRICING.bw[pageSize]) + (coloredPages * PRICING.colored[pageSize]);

  const completeSale = async () => {
    if (totalCost <= 0) return;
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("pos_sales").insert({
        sale_type: "print",
        status: "completed",
        items: [
          ...(bwPages > 0 ? [{ name: `B&W ${pageSize}`, quantity: bwPages, price: PRICING.bw[pageSize] }] : []),
          ...(coloredPages > 0 ? [{ name: `Colored ${pageSize}`, quantity: coloredPages, price: PRICING.colored[pageSize] }] : []),
        ],
        subtotal: totalCost,
        total: totalCost,
        main_admin_commission: totalCost * 0.5,
        member_admin_earnings: totalCost * 0.5,
        sold_by: user.id,
      });

      if (error) throw error;

      toast.success(`Print sale completed! ₱${totalCost.toFixed(2)}`);
      setBwPages(0); setColoredPages(0); setCustomerName("");
      onSaleComplete();
    } catch (e: any) {
      console.error("Print POS sale error:", e);
      toast.error(e.message || "Failed to complete print sale");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["short", "a4", "long"] as const).map(size => (
          <button key={size} onClick={() => setPageSize(size)}
            className={`flex-1 rounded-xl border-2 p-2 text-center transition-all ${
              pageSize === size ? "border-primary bg-primary/10" : "border-border bg-muted/50"
            }`}>
            <span className="font-bold text-[10px] block uppercase">{size}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <span className="text-[10px] text-muted-foreground font-bold block mb-2">B&W Pages</span>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setBwPages(Math.max(0, bwPages - 1))} className="p-1.5 rounded-lg bg-muted"><Minus className="h-4 w-4" /></button>
            <Input type="number" value={bwPages || ""} onChange={e => setBwPages(Math.max(0, Number(e.target.value)))} className="w-16 text-center font-extrabold text-lg h-10" />
            <button onClick={() => setBwPages(bwPages + 1)} className="p-1.5 rounded-lg bg-muted"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <span className="text-[10px] text-muted-foreground font-bold block mb-2">Colored Pages</span>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setColoredPages(Math.max(0, coloredPages - 1))} className="p-1.5 rounded-lg bg-muted"><Minus className="h-4 w-4" /></button>
            <Input type="number" value={coloredPages || ""} onChange={e => setColoredPages(Math.max(0, Number(e.target.value)))} className="w-16 text-center font-extrabold text-lg h-10" />
            <button onClick={() => setColoredPages(coloredPages + 1)} className="p-1.5 rounded-lg bg-muted"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
      <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (optional - not saved)" className="text-xs h-8" />
      {totalCost > 0 && (
        <Button onClick={completeSale} disabled={submitting} className="w-full bg-primary text-white font-extrabold rounded-xl">
          <Receipt className="h-4 w-4 mr-2" />{submitting ? "Processing..." : `Complete Print Sale — ₱${totalCost.toFixed(2)}`}
        </Button>
      )}
    </div>
  );
}

/* ────────── Sales History ────────── */
function SalesHistory({ sales }: { sales: any[] }) {
  if (sales.length === 0) return <p className="text-center text-sm text-muted-foreground py-8">No sales yet</p>;
  return (
    <div className="space-y-1.5 max-h-96 overflow-y-auto">
      {sales.map((s: any) => (
        <div key={s.id} className="bg-card rounded-lg border border-border p-2.5">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              {s.sale_type === "product" ? <ShoppingCart className="h-3 w-3 text-primary" /> : <Printer className="h-3 w-3 text-purple-500" />}
              <span className="font-bold text-[11px]">{s.customer_name || "Walk-in"}</span>
            </div>
            <span className="font-extrabold text-xs text-primary">₱{Number(s.total).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="uppercase font-bold">{s.sale_type}</span>
            <span>•</span>
            <span>{new Date(s.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────── Main POS Tab ────────── */
export default function POSTab({ role }: { role: string; onSaleComplete: () => void }) {
  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0 });

  const loadSales = useCallback(async () => {
    try {
      // Fetch without server-side ordering to avoid potential 400 errors
      const { data, error } = await (supabase as any).from("pos_sales").select("*");
      if (error) {
        console.error("POS sales load error:", error);
        toast.error("Failed to load sales: " + error.message);
        return;
      }
      const all = (data || []).sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setSales(all.slice(0, 100));
      setStats({
        totalSales: all.length,
        totalRevenue: all.reduce((s: number, r: any) => s + Number(r.total || 0), 0),
      });
    } catch (e: any) {
      console.error("POS sales exception:", e);
      toast.error("Failed to load sales history");
    }
  }, []);

  useEffect(() => { loadSales(); }, [loadSales]);

  return (
    <div className="space-y-4 pb-6">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-extrabold text-primary">₱{stats.totalRevenue.toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground font-bold">Total Revenue</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-extrabold text-foreground">{stats.totalSales}</p>
          <p className="text-[9px] text-muted-foreground font-bold">Total Sales</p>
        </div>
      </div>

      <Tabs defaultValue="product" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-9">
          <TabsTrigger value="product" className="text-[10px] gap-1"><ShoppingCart className="h-3 w-3" />Products</TabsTrigger>
          <TabsTrigger value="print" className="text-[10px] gap-1"><Printer className="h-3 w-3" />Printing</TabsTrigger>
          <TabsTrigger value="history" className="text-[10px] gap-1"><Receipt className="h-3 w-3" />History</TabsTrigger>
        </TabsList>
        <TabsContent value="product"><ProductPOS role={role} onSaleComplete={loadSales} /></TabsContent>
        <TabsContent value="print"><PrintPOS role={role} onSaleComplete={loadSales} /></TabsContent>
        <TabsContent value="history"><SalesHistory sales={sales} /></TabsContent>
      </Tabs>
    </div>
  );
}