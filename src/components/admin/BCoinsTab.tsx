import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Coins, RefreshCw, Gift } from "lucide-react";
import { sendNotification } from "@/lib/notifications";

export default function BCoinsTab() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("bcoins_redemptions").select("*, profiles(first_name, last_name, email)").order("created_at", { ascending: false });
    setRedemptions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { data: redemption } = await (supabase as any).from("bcoins_redemptions").select("*").eq("id", id).maybeSingle();
      if (!redemption) return;

      await (supabase as any).from("bcoins_redemptions").update({ status }).eq("id", id);

      if (status === "completed") {
        // No need to refund if completed      } else if (status === "rejected") {
        // Refund BCoins if rejected
        const { data: wallet } = await (supabase as any).from("bcoins_wallets").select("balance").eq("user_id", redemption.user_id).maybeSingle();
        if (wallet) {
          await (supabase as any).from("bcoins_wallets").update({ balance: Number(wallet.balance) + Number(redemption.bcoins_amount) }).eq("user_id", redemption.user_id);
          await (supabase as any).from("bcoins_transactions").insert({ user_id: redemption.user_id, amount: Number(redemption.bcoins_amount), type: "refund", description: `Refund for rejected ₱${redemption.gcash_amount} GCash redemption` });
        }
      }

      await sendNotification({
        title: `🎁 Redemption ${status.toUpperCase()}`,
        message: `Your ₱${redemption.gcash_amount} GCash redemption has been ${status}.`,
        type: "redemption_status",
        userId: redemption.user_id,
        link: "/bcoins",
        icon: "🎁"
      });

      toast.success(`Redemption ${status}!`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const filtered = filter === "all" ? redemptions : redemptions.filter(r => r.status === filter);
  const statusCounts = {
    all: redemptions.length,
    pending: redemptions.filter(r => r.status === "pending").length,
    completed: redemptions.filter(r => r.status === "completed").length,
    rejected: redemptions.filter(r => r.status === "rejected").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Object.entries(statusCounts).map(([key, count]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
            </button>
          </button>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(r => (
          <div key={r.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-bold text-xs">{r.profiles?.first_name} {r.profiles?.last_name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.gcash_number}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : r.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>{r.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-2">
              <div className="bg-muted rounded-lg p-1.5">
                <span className="text-sm font-extrabold text-primary block">₱{r.gcash_amount}</span>
                <span className="text-[9px] text-muted-foreground">GCash</span>
              </div>
              <div className="bg-muted rounded-lg p-1.5">
                <span className="text-sm font-extrabold text-warning block">{Number(r.bcoins_amount).toFixed(1)}</span>
                <span className="text-[9px] text-muted-foreground">BCoins</span>
              </div>
              <div className="bg-muted rounded-lg p-1.5">
                <span className="text-sm font-extrabold block">{new Date(r.created_at).toLocaleDateString()}</span>
                <span className="text-[9px] text-muted-foreground">Date</span>
              </div>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateStatus(r.id, "completed")} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(r.id, "rejected")} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Reject</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
</dyad<think>-write>

Now continue with next file.
</think><dyad-write path="src/components/admin/OrdersTab.tsx" description="Fixing TypeScript errors in OrdersTab.tsx">
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, CheckCircle2, XCircle, Truck, Package, RefreshCw, Eye } from "lucide-react";
import { sendNotification } from "@/lib/notifications";

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { data: order } = await (supabase as any).from("orders").select("*").eq("id", orderId).maybeSingle();
      if (!order) return;

      await (supabase as any).from("orders").update({ status: newStatus }).eq("id", orderId);
      
      // Notify customer      await sendNotification({
        title: `🛒 Order ${newStatus.toUpperCase()}`,
        message: `Your order #${orderId.slice(0, 8)} is now ${newStatus}.`,
        type: "order_status",
        userId: order.user_id,
        link: "/orders",
        icon: "📦"
      });

      toast.success(`Order ${newStatus}!`);
      loadOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update order");
    }
  };

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const matchSearch = !search || 
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusCounts: Record<string, number> = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => o.status === "approved").length,
    ready: orders.filter(o => o.status === "ready").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
    canceled: orders.filter(o => o.status === "canceled").length,
  };

  if (selectedOrder) {
    const items = selectedOrder.items || [];
    return (
      <div className="space-y-3">
        <button onClick={() => setSelectedOrder(null)} className="text-xs text-primary font-bold">← Back to Orders</button>
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Order #{selectedOrder.id.slice(0, 8)}</h3>
              <p className="text-[10px] text-muted-foreground">{selectedOrder.customer_name || "Customer"} • {new Date(selectedOrder.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              selectedOrder.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
              selectedOrder.status === 'pending' ? 'bg-warning/20 text-warning' :
              selectedOrder.status === 'rejected' || selectedOrder.status === 'canceled' ? 'bg-destructive/20 text-destructive' :
              'bg-primary/20 text-primary'
            }`}>{selectedOrder.status}</span>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground">ITEMS</p>
            {items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <span>{item.name} ×{item.quantity}</span>
                <span>₱{(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-1 mt-1">
              <div className="flex justify-between text-xs font-bold">
                <span>Total</span>
                <span className="text-primary">₱{Number(selectedOrder.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {selectedOrder.delivery_type && (
            <div className="text-[10px] text-muted-foreground">
              {selectedOrder.delivery_type === 'delivery' ? '🚚 Delivery' : '📦 Pickup'} • {selectedOrder.pickup_date} at {selectedOrder.pickup_time}
              {Number(selectedOrder.delivery_fee) > 0 && <p>Delivery Fee: ₱{Number(selectedOrder.delivery_fee).toFixed(2)}</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {selectedOrder.status === "pending" && (
              <>
                <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "approved")} className="gap-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedOrder.id, "rejected")} className="gap-1"><XCircle className="h-3 w-3" /> Reject</Button>
              </>
            )}
            {selectedOrder.status === "approved" && (
              <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "ready")} className="gap-1"><Truck className="h-3 w-3" /> Mark Ready</Button>
            )}
            {["pending", "approved", "ready"].includes(selectedOrder.status) && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(selectedOrder.id, "canceled")} className="gap-1"><XCircle className="h-3 w-3" /> Cancel</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="pl-9 text-sm h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={loadOrders} disabled={loading}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map(order => (
          <div key={order.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold truncate">{order.customer_name || "Customer"}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                  order.status === 'pending' ? 'bg-warning/20 text-warning' :
                  order.status === 'rejected' || order.status === 'canceled' ? 'bg-destructive/20 text-destructive' :
                  'bg-primary/20 text-primary'
                }">{order.status}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">#{order.id.slice(0, 8)} • {new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-primary">₱{Number(order.total).toFixed(2)}</span>
              <button onClick={() => setSelectedOrder(order)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80"><Eye className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
</dyad-write<think>>

Now continue with next file.
</think><dyad-write path="src/components/admin/ProductsTab.tsx" description="Fixing TypeScript errors in ProductsTab.tsx">
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Package, Upload, X } from "lucide-react";
import { products as fallbackProducts } from "@/data/products";

export default function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    (supabase as any).from("products").select("*").order("created_at", { ascending: false })
      .then(({ data }: any) => setProducts(data || []));
  };
  useEffect(load, []);

  const resetForm = () => setForm({
    name: "", price: 0, original_price: "", image: "", category: "",
    stock: 0, description: "", is_flash_sale: false,
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("seller-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("seller-images").getPublicUrl(path);
      setForm(f => ({ ...f, image: publicUrl }));
      toast.success("Image uploaded!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (form.price <= 0) { toast.error("Price must be greater than 0"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: form.price,
        original_price: form.original_price ? Number(form.original_price) : null,
        image: form.image.trim(),
        category: form.category.trim(),
        stock: form.stock,
        description: form.description.trim(),
        is_flash_sale: form.is_flash_sale,
        is_active: true,
        rating: 4.5,
        sold: 0,
      };

      if (editId) {
        const { error } = await (supabase as any).from("products").update(payload).eq("id", editId);
        if (error) throw error;
        toast.success("Product updated!");
      } else {
        const id = `prod-${Date.now()}`;
        const { error } = await (supabase as any).from("products").insert({ ...payload, id });
        if (error) throw error;
        toast.success("Product added!");
      }
      resetForm(); setShowForm(false); setEditId(null); load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const edit = (p: any) => {
    setForm({
      name: p.name, price: Number(p.price),
      original_price: p.original_price || "", image: p.image || "",
      category: p.category || "", stock: p.stock || 0,
      description: p.description || "", is_flash_sale: p.is_flash_sale || false,
    });
    setEditId(p.id); setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await (supabase as any).from("products").delete().eq("id", id);
    load(); toast.success("Product deleted");
  };

  const toggleActive = async (id: string, active: boolean) => {
    await (supabase as any).from("products").update({ is_active: !active }).eq("id", id);
    load();
  };

  const filter = (p: any) => 
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || "").toLowerCase().includes(search.toLowerCase());

  const filtered = products.filter(filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-sm h-9"
          />
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs">{editId ? "Edit" : "New"} Product</span>
            <button onClick={resetForm} className="text-[10px]">Cancel</button>
          </div>
          <div>
            <Label className="text-[10px]">Product Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Notebook" className="text-sm" />
          </div>
          <div>
            <Label className="text-[10px]">Category</Label>
            <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. notebooks" className="text-sm" />
          </div>
          <div>
            <Label className="text-[10px]">Price ₱</Label>
            <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="text-sm" />
          </div>
          <div>
            <Label className="text-[10px]">Orig Price</Label>
            <Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} className="text-sm" />
          </div>
          <div>
            <Label className="text-[10px]">Stock</Label>
            <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="text-sm" />
          </div>
          <div>
            <Label className="text-[10px]">Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-sm" rows={2} />
          </div>
          <div>
            <Label className="text-[10px]">Image</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file); }} />
            {form.image ? (
              <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border mt-1">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setForm(f => ({ ...f, image: "" }))} className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground">{uploading ? "Uploading..." : "Tap to upload"}</span>
              </button>
            </div>
          </div>
          <Button onClick={save} disabled={saving} size="sm" className="w-full gap-1">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
            {editId ? "Update" : "Add"} Product
          </Button>
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.map(p => (
          <div key={p.id} className="bg-card rounded-lg p-2 border border-border flex items-center gap-2">
            {p.image && <img src={p.image} className="h-10 w-10 rounded object-cover flex-shrink-0" alt="" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">
                ₱{p.price} · Stock: <span className={`font-bold ${(p.stock || 0) <= 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>{p.stock || 0}</span>
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0 items-center">
              <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
              <button onClick={() => edit(p)} className="p-1 text-primary"><Edit2 className="h-3 w-3" /></button>
              <button onClick={() => remove(p.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))} 
        {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No products found</p>} 
      </div>
    </div>
  );
}