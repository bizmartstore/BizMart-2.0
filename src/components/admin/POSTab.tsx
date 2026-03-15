import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShoppingCart, Printer, Plus, Minus, Trash2, Receipt, Search, X,
  DollarSign, TrendingUp, Users, Package,
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
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    (supabase as any).from("products").select("*").eq("is_active", true).order("name")
      .then(({ data }: any) => setProducts(data || []));
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

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
      await (supabase as any).from("pos_sales").insert({
        sale_type: "product",
        items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity, image: c.image })),
        subtotal,
        total: subtotal,
        main_admin_commission: mainAdminCommission,
        seller_earnings: sellerEarnings,
        member_admin_earnings: memberAdminCommission,
        sold_by: user.id,
        customer_name: customerName.trim(),
        notes: "",
      });

      sendNotification({
        title: "🧾 New POS Product Sale",
        message: `${customerName || "Walk-in"} — ₱${subtotal.toFixed(2)} (${cart.length} items)`,
        icon: "🧾",
        link: "/admin?tab=pos",
        type: "pos_sale",
        targetRole: "admin",
      });

      toast.success(`Sale completed! ₱${subtotal.toFixed(2)} 🧾`);
      setCart([]);
      setCustomerName("");
      onSaleComplete();
    } catch (e: any) {
      toast.error(e.message || "Failed to complete sale");
    }
    setSubmitting(false);
  };

  // Desktop layout: side-by-side product grid + cart
  if (!isMobile) {
    return (
      <div className="flex gap-6 min-h-[500px]">
        {/* Left: Product catalog */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-10 h-11 text-sm rounded-xl"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat === "all" ? "All Products" : cat}
              </button>
            ))}
          </div>

          {/* Product grid - larger for desktop */}
          <div className="grid grid-cols-4 xl:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-card border border-border rounded-xl p-3 text-center hover:border-primary hover:shadow-lg transition-all group"
              >
                {p.image ? (
                  <img src={p.image} className="h-16 w-16 rounded-lg object-cover mx-auto mb-2 group-hover:scale-105 transition-transform" alt="" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <p className="text-xs font-bold truncate text-foreground">{p.name}</p>
                <p className="text-sm text-primary font-extrabold mt-0.5">₱{Number(p.price).toFixed(2)}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Stock: {p.stock}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">No products found</p>
            )}
          </div>
        </div>

        {/* Right: Cart panel */}
        <div className="w-[380px] flex-shrink-0 bg-card border border-border rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-foreground">Current Order</h3>
                <p className="text-[10px] text-muted-foreground">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-destructive font-bold hover:underline">Clear All</button>
            )}
          </div>

          {/* Customer name */}
          <Input
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="👤 Customer name (optional)"
            className="text-sm h-10 rounded-xl mb-4"
          />

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-xs">Tap a product to add it</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  {item.image ? (
                    <img src={item.image} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" alt="" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">₱{item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center font-extrabold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-extrabold text-sm text-primary w-16 text-right">₱{(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.id)} className="text-destructive/60 hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          {cart.length > 0 && (
            <div className="border-t border-border pt-4 space-y-3">
              <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-foreground">₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Main Admin (10%)</span>
                  <span className="font-bold text-primary">₱{mainAdminCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Member Admin (10%)</span>
                  <span className="font-bold text-purple-500">₱{memberAdminCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Seller (80%)</span>
                  <span className="font-bold text-emerald-500">₱{sellerEarnings.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="font-bold text-sm text-foreground">Total</span>
                <span className="font-extrabold text-2xl text-primary">₱{subtotal.toFixed(2)}</span>
              </div>

              <Button
                onClick={completeSale}
                disabled={submitting}
                className="w-full h-12 gap-2 font-extrabold text-sm rounded-xl shadow-lg"
                size="lg"
              >
                <Receipt className="h-5 w-5" />
                {submitting ? "Processing..." : `Complete Sale`}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile layout (original)
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 text-xs h-9" />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
        {filtered.map(p => (
          <button key={p.id} onClick={() => addToCart(p)}
            className="bg-card border border-border rounded-lg p-2 text-center hover:border-primary transition-colors active:scale-95">
            {p.image && <img src={p.image} className="h-10 w-10 rounded object-cover mx-auto mb-1" alt="" />}
            <p className="text-[10px] font-bold truncate">{p.name}</p>
            <p className="text-[10px] text-primary font-extrabold">₱{Number(p.price).toFixed(2)}</p>
          </button>
        ))}
        {filtered.length === 0 && <p className="col-span-3 text-center text-[10px] text-muted-foreground py-4">No products found</p>}
      </div>

      {cart.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3 space-y-2">
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
            <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Subtotal</span><span className="font-bold">₱{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Main Admin (10%)</span><span className="font-bold text-primary">₱{mainAdminCommission.toFixed(2)}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Member Admin (10%)</span><span className="font-bold text-secondary">₱{memberAdminCommission.toFixed(2)}</span></div>
            <div className="flex justify-between text-[10px]"><span className="text-muted-foreground">Seller (80%)</span><span className="font-bold text-emerald-500">₱{sellerEarnings.toFixed(2)}</span></div>
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
  const isMobile = useIsMobile();
  const [bwPages, setBwPages] = useState(0);
  const [coloredPages, setColoredPages] = useState(0);
  const [pageSize, setPageSize] = useState<"short" | "a4" | "long">("short");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const PRICING = {
    bw: { short: 3.0, a4: 3.0, long: 5.0 },
    colored: { short: 8.0, a4: 8.0, long: 10.0 },
  };

  const bwCost = bwPages * PRICING.bw[pageSize];
  const coloredCost = coloredPages * PRICING.colored[pageSize];
  const totalCost = bwCost + coloredCost;
  const mainAdminCommission = Number((totalCost * 0.50).toFixed(2));
  const memberAdminEarnings = Number((totalCost - mainAdminCommission).toFixed(2));

  const completeSale = async () => {
    if (totalCost <= 0) { toast.error("Add pages to complete sale"); return; }
    if (!user) return;
    setSubmitting(true);
    try {
      await (supabase as any).from("pos_sales").insert({
        sale_type: "print",
        items: [
          ...(bwPages > 0 ? [{ name: `B&W ${pageSize.toUpperCase()}`, quantity: bwPages, price: PRICING.bw[pageSize] }] : []),
          ...(coloredPages > 0 ? [{ name: `Colored ${pageSize.toUpperCase()}`, quantity: coloredPages, price: PRICING.colored[pageSize] }] : []),
        ],
        subtotal: totalCost,
        total: totalCost,
        main_admin_commission: mainAdminCommission,
        member_admin_earnings: memberAdminEarnings,
        seller_earnings: 0,
        sold_by: user.id,
        customer_name: customerName.trim(),
        notes: notes.trim(),
      });

      sendNotification({
        title: "🖨️ New POS Print Sale",
        message: `${customerName || "Walk-in"} — ₱${totalCost.toFixed(2)} (${bwPages + coloredPages} pages)`,
        icon: "🖨️",
        link: "/admin?tab=pos",
        type: "pos_print_sale",
        targetRole: "admin",
      });

      toast.success(`Print sale completed! ₱${totalCost.toFixed(2)} 🖨️`);
      setBwPages(0);
      setColoredPages(0);
      setCustomerName("");
      setNotes("");
      onSaleComplete();
    } catch (e: any) {
      toast.error(e.message || "Failed to complete sale");
    }
    setSubmitting(false);
  };

  if (!isMobile) {
    return (
      <div className="flex gap-6">
        {/* Left: Print config */}
        <div className="flex-1 space-y-5">
          {/* Page Size Selection */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Paper Size</label>
            <div className="grid grid-cols-3 gap-3">
              {(["short", "a4", "long"] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    pageSize === size ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className="font-extrabold text-sm block text-foreground">{size === "short" ? "Short" : size === "a4" ? "A4" : "Long"}</span>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">B&W: ₱{PRICING.bw[size].toFixed(2)}/pg</p>
                    <p className="text-[10px] text-muted-foreground">Color: ₱{PRICING.colored[size].toFixed(2)}/pg</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Page Counts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🖤</span>
              </div>
              <span className="text-xs text-muted-foreground font-bold block mb-3">Black & White</span>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setBwPages(Math.max(0, bwPages - 1))} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <Input
                  type="number"
                  value={bwPages || ""}
                  onChange={e => setBwPages(Math.max(0, Number(e.target.value)))}
                  className="w-20 text-center font-extrabold text-xl h-12 rounded-xl"
                />
                <button onClick={() => setBwPages(bwPages + 1)} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-primary font-bold mt-2 block">₱{PRICING.bw[pageSize].toFixed(2)}/page</span>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5 text-center">
              <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🌈</span>
              </div>
              <span className="text-xs text-muted-foreground font-bold block mb-3">Colored</span>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setColoredPages(Math.max(0, coloredPages - 1))} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <Input
                  type="number"
                  value={coloredPages || ""}
                  onChange={e => setColoredPages(Math.max(0, Number(e.target.value)))}
                  className="w-20 text-center font-extrabold text-xl h-12 rounded-xl"
                />
                <button onClick={() => setColoredPages(coloredPages + 1)} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-primary font-bold mt-2 block">₱{PRICING.colored[pageSize].toFixed(2)}/page</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="👤 Customer name (optional)" className="text-sm h-10 rounded-xl" />
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="📝 Notes (optional)" className="text-sm h-10 rounded-xl" />
          </div>
        </div>

        {/* Right: Summary panel */}
        <div className="w-[340px] flex-shrink-0">
          <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-6 text-white sticky top-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm">Print Summary</h3>
                <p className="text-[10px] opacity-80">{bwPages + coloredPages} total pages</p>
              </div>
            </div>

            {totalCost > 0 ? (
              <>
                <div className="space-y-2 mb-4">
                  {bwPages > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-80">{bwPages}× B&W ({pageSize.toUpperCase()})</span>
                      <span className="font-bold">₱{bwCost.toFixed(2)}</span>
                    </div>
                  )}
                  {coloredPages > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="opacity-80">{coloredPages}× Colored ({pageSize.toUpperCase()})</span>
                      <span className="font-bold">₱{coloredCost.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/20 pt-3 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold">Total</span>
                    <span className="font-extrabold text-3xl">₱{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="opacity-80">Main Admin (50%)</span>
                      <span className="font-bold">₱{mainAdminCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="opacity-80">Member Admin (50%)</span>
                      <span className="font-bold">₱{memberAdminEarnings.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={completeSale}
                  disabled={submitting}
                  className="w-full bg-white text-violet-600 font-extrabold hover:bg-white/90 rounded-xl h-12 text-sm shadow-lg"
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  {submitting ? "Processing..." : "Complete Print Sale"}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 opacity-60">
                <Printer className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Add pages to see summary</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout (original)
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["short", "a4", "long"] as const).map(size => (
          <button key={size} onClick={() => setPageSize(size)}
            className={`flex-1 rounded-xl border-2 p-2.5 text-center transition-all ${
              pageSize === size ? "border-primary bg-primary/10" : "border-border bg-muted/50"
            }`}>
            <span className="font-bold text-[10px] block">{size === "short" ? "Short" : size === "a4" ? "A4" : "Long"}</span>
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
          <span className="text-[10px] text-primary font-bold mt-1 block">₱{PRICING.bw[pageSize].toFixed(2)}/page</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <span className="text-[10px] text-muted-foreground font-bold block mb-2">Colored Pages</span>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setColoredPages(Math.max(0, coloredPages - 1))} className="p-1.5 rounded-lg bg-muted"><Minus className="h-4 w-4" /></button>
            <Input type="number" value={coloredPages || ""} onChange={e => setColoredPages(Math.max(0, Number(e.target.value)))} className="w-16 text-center font-extrabold text-lg h-10" />
            <button onClick={() => setColoredPages(coloredPages + 1)} className="p-1.5 rounded-lg bg-muted"><Plus className="h-4 w-4" /></button>
          </div>
          <span className="text-[10px] text-primary font-bold mt-1 block">₱{PRICING.colored[pageSize].toFixed(2)}/page</span>
        </div>
      </div>
      <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (optional)" className="text-xs h-8" />
      <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="text-xs h-8" />
      {totalCost > 0 && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-3 text-white">
          <div className="space-y-1 mb-2">
            {bwPages > 0 && <div className="flex justify-between text-[11px]"><span className="opacity-80">{bwPages}× B&W ({pageSize.toUpperCase()})</span><span className="font-bold">₱{bwCost.toFixed(2)}</span></div>}
            {coloredPages > 0 && <div className="flex justify-between text-[11px]"><span className="opacity-80">{coloredPages}× Colored ({pageSize.toUpperCase()})</span><span className="font-bold">₱{coloredCost.toFixed(2)}</span></div>}
            <div className="border-t border-white/30 pt-1 flex justify-between text-sm"><span className="font-bold">Total</span><span className="font-extrabold text-lg">₱{totalCost.toFixed(2)}</span></div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 space-y-0.5 mb-2">
            <div className="flex justify-between text-[10px]"><span className="opacity-80">Main Admin (50%)</span><span className="font-bold">₱{mainAdminCommission.toFixed(2)}</span></div>
            <div className="flex justify-between text-[10px]"><span className="opacity-80">Member Admin (50%)</span><span className="font-bold">₱{memberAdminEarnings.toFixed(2)}</span></div>
          </div>
          <Button onClick={completeSale} disabled={submitting} className="w-full bg-white text-purple-600 font-extrabold hover:bg-white/90 rounded-xl">
            <Receipt className="h-4 w-4 mr-2" />{submitting ? "Processing..." : "Complete Print Sale"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ────────── Sales History ────────── */
function SalesHistory({ sales }: { sales: any[] }) {
  const isMobile = useIsMobile();

  if (sales.length === 0) return <p className="text-center text-sm text-muted-foreground py-8">No sales yet</p>;

  if (!isMobile) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-bold text-xs text-muted-foreground uppercase">Type</th>
              <th className="text-left py-3 px-4 font-bold text-xs text-muted-foreground uppercase">Customer</th>
              <th className="text-right py-3 px-4 font-bold text-xs text-muted-foreground uppercase">Total</th>
              <th className="text-right py-3 px-4 font-bold text-xs text-muted-foreground uppercase">Admin</th>
              <th className="text-right py-3 px-4 font-bold text-xs text-muted-foreground uppercase">Seller</th>
              <th className="text-right py-3 px-4 font-bold text-xs text-muted-foreground uppercase">Member</th>
              <th className="text-right py-3 px-4 font-bold text-xs text-muted-foreground uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s: any) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {s.sale_type === "product" ? (
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Printer className="h-3.5 w-3.5 text-violet-500" />
                      </div>
                    )}
                    <span className="text-xs font-bold capitalize">{s.sale_type}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs font-medium text-foreground">{s.customer_name || "Walk-in"}</td>
                <td className="py-3 px-4 text-right font-extrabold text-sm text-primary">₱{Number(s.total).toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-xs font-bold text-primary/70">₱{Number(s.main_admin_commission).toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-xs font-bold text-emerald-500">₱{Number(s.seller_earnings).toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-xs font-bold text-violet-500">₱{Number(s.member_admin_earnings).toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-[11px] text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto">
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
export default function POSTab({ role }: { role: string }) {
  const isMobile = useIsMobile();
  const [sales, setSales] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0, mainAdminTotal: 0, sellerTotal: 0, memberAdminTotal: 0 });

  const loadSales = useCallback(() => {
    (supabase as any).from("pos_sales").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }: any) => {
        const all = data || [];
        setSales(all);
        setStats({
          totalSales: all.length,
          totalRevenue: all.reduce((s: number, r: any) => s + Number(r.total), 0),
          mainAdminTotal: all.reduce((s: number, r: any) => s + Number(r.main_admin_commission), 0),
          sellerTotal: all.reduce((s: number, r: any) => s + Number(r.seller_earnings), 0),
          memberAdminTotal: all.reduce((s: number, r: any) => s + Number(r.member_admin_earnings), 0),
        });
      });
  }, []);

  useEffect(() => { loadSales(); }, [loadSales]);

  useEffect(() => {
    const channel = supabase
      .channel("pos-sales-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_sales" }, () => loadSales())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadSales]);

  return (
    <div className="space-y-4 pb-6">
      {/* Stats Row */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-5"}`}>
        <div className={`bg-card rounded-2xl p-4 border border-border ${isMobile ? "text-center" : "flex items-center gap-4"}`}>
          {!isMobile && (
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <p className={`font-extrabold text-primary ${isMobile ? "text-xl" : "text-2xl"}`}>₱{stats.totalRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground font-bold">Total Revenue</p>
          </div>
        </div>
        <div className={`bg-card rounded-2xl p-4 border border-border ${isMobile ? "text-center" : "flex items-center gap-4"}`}>
          {!isMobile && (
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-foreground" />
            </div>
          )}
          <div>
            <p className={`font-extrabold text-foreground ${isMobile ? "text-xl" : "text-2xl"}`}>{stats.totalSales}</p>
            <p className="text-[10px] text-muted-foreground font-bold">Total Sales</p>
          </div>
        </div>
        {!isMobile && (
          <>
            <div className="bg-card rounded-2xl p-4 border border-primary/20 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👑</span>
              </div>
              <div>
                <p className="font-extrabold text-primary text-xl">₱{stats.mainAdminTotal.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground font-bold">Main Admin</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-emerald-500/20 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏪</span>
              </div>
              <div>
                <p className="font-extrabold text-emerald-500 text-xl">₱{stats.sellerTotal.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground font-bold">Sellers</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-4 border border-violet-500/20 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🛡️</span>
              </div>
              <div>
                <p className="font-extrabold text-violet-500 text-xl">₱{stats.memberAdminTotal.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground font-bold">Member Admin</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile-only commission cards */}
      {isMobile && (
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-primary/10 rounded-lg p-2 text-center border border-primary/20">
            <p className="text-sm font-extrabold text-primary">₱{stats.mainAdminTotal.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground font-bold">Main Admin</p>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
            <p className="text-sm font-extrabold text-emerald-500">₱{stats.sellerTotal.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground font-bold">Sellers</p>
          </div>
          <div className="bg-violet-500/10 rounded-lg p-2 text-center border border-violet-500/20">
            <p className="text-sm font-extrabold text-violet-500">₱{stats.memberAdminTotal.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground font-bold">Member Admin</p>
          </div>
        </div>
      )}

      {/* POS Tabs */}
      <Tabs defaultValue="product" className="w-full">
        <TabsList className={`grid grid-cols-3 w-full ${isMobile ? "h-9" : "h-11"}`}>
          <TabsTrigger value="product" className={`gap-1.5 ${isMobile ? "text-[11px]" : "text-sm"}`}>
            <ShoppingCart className={isMobile ? "h-3 w-3" : "h-4 w-4"} />Products
          </TabsTrigger>
          <TabsTrigger value="print" className={`gap-1.5 ${isMobile ? "text-[11px]" : "text-sm"}`}>
            <Printer className={isMobile ? "h-3 w-3" : "h-4 w-4"} />Printing
          </TabsTrigger>
          <TabsTrigger value="history" className={`gap-1.5 ${isMobile ? "text-[11px]" : "text-sm"}`}>
            <Receipt className={isMobile ? "h-3 w-3" : "h-4 w-4"} />History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="product" className={isMobile ? "" : "mt-4"}>
          <ProductPOS role={role} onSaleComplete={loadSales} />
        </TabsContent>
        <TabsContent value="print" className={isMobile ? "" : "mt-4"}>
          <PrintPOS role={role} onSaleComplete={loadSales} />
        </TabsContent>
        <TabsContent value="history" className={isMobile ? "" : "mt-4"}>
          <SalesHistory sales={sales} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
