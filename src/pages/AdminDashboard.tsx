import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Check, X, Shield, Crown, Megaphone,
  Package, Users, Image, Tag, Smartphone, Store, LogOut, Edit2, Coins, Bell, ShoppingCart, Printer, Settings, UserPlus, Receipt, Download, MessageCircle, Briefcase, RefreshCw, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import POSTab from "@/components/admin/POSTab";
import CodesTab from "@/components/admin/CodesTab";
import NewsTab from "@/components/admin/NewsTab";
import AdminMessagesTab from "@/components/admin/AdminMessagesTab";
import { 
  notifyCustomerGCashComplete, 
  notifyCustomerRedemptionStatus, 
  notifyCustomerOrder, 
  notifyCustomerBCoins, 
  notifyAnnouncement, 
  notifyCustomerPrintStatus, 
  notifyCustomerOrderApproval,
  notifyOrderUpdate
} from "@/lib/notifications";
import { sendTelegramOrderNotify } from "@/lib/telegramNotify";
import { products as defaultProducts } from "@/data/products";
import { getPushStatus } from "@/hooks/useOneSignal";

/* ─── Overview Tab ─── */
function OverviewTab({ role }: { role: string }) {
  const isMainAdmin = role === 'main_admin';
  const [storeOpen, setStoreOpen] = useState(true);
  const [closeMsg, setCloseMsg] = useState("Store is currently closed.");
  const [pushStatus, setPushStatus] = useState<any>(null);
  const [stats, setStats] = useState({ products: 0, users: 0, pendingGcash: 0, activeMembers: 0, totalCommission: 0, memberAdminOrderCommission: 0, printRevenue: 0, printCommission: 0, posSales: 0, posMainAdmin: 0, posMemberAdmin: 0, posSeller: 0 });

  const loadStats = useCallback(() => {
    (supabase as any).from('app_settings').select('*').eq('key', 'store_status').single()
      .then(({ data }: any) => {
        if (data) { setStoreOpen(data.value.is_open); setCloseMsg(data.value.close_message || ''); }
      });
    
    getPushStatus().then(setPushStatus);

    Promise.all([
      (supabase as any).from('products').select('id', { count: 'exact', head: true }),
      (supabase as any).from('profiles').select('id', { count: 'exact', head: true }),
      (supabase as any).from('gcash_transactions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      (supabase as any).from('club_memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      (supabase as any).from('orders').select('admin_commission, member_admin_commission, seller_earnings').in('status', ['approved', 'completed']),
      (supabase as any).from('print_orders').select('cost, maintenance_fee').eq('status', 'confirmed'),
      (supabase as any).from('pos_sales').select('total, main_admin_commission, member_admin_earnings, seller_earnings'),
    ]).then(([p, u, g, m, o, pr, pos]: any[]) => {
      const totalCommission = (o.data || []).reduce((sum: number, r: any) => sum + Number(r.admin_commission || 0), 0);
      const memberAdminOrderCommission = (o.data || []).reduce((sum: number, r: any) => sum + Number(r.member_admin_commission || 0), 0);
      const printRevenue = (pr.data || []).reduce((sum: number, r: any) => sum + Number(r.cost || 0), 0);
      const printCommission = (pr.data || []).reduce((sum: number, r: any) => sum + Number(r.maintenance_fee || 0), 0);
      const posSales = (pos.data || []).reduce((s: number, r: any) => s + Number(r.total || 0), 0);
      const posMainAdmin = (pos.data || []).reduce((s: number, r: any) => s + Number(r.main_admin_commission || 0), 0);
      const posMemberAdmin = (pos.data || []).reduce((s: number, r: any) => s + Number(r.member_admin_earnings || 0), 0);
      const posSeller = (pos.data || []).reduce((s: number, r: any) => s + Number(r.seller_earnings || 0), 0);
      setStats({ products: p.count || 0, users: u.count || 0, pendingGcash: g.count || 0, activeMembers: m.count || 0, totalCommission, memberAdminOrderCommission, printRevenue, printCommission, posSales, posMainAdmin, posMemberAdmin, posSeller });
    });
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const saveStore = async (open: boolean) => {
    setStoreOpen(open);
    await (supabase as any).from('app_settings').update({
      value: { is_open: open, close_message: closeMsg }, updated_at: new Date().toISOString()
    }).eq('key', 'store_status');
    
    notifyAnnouncement(open ? "🟢 Store is OPEN!" : "🔴 Store is CLOSED", open ? "The store is open! Browse and place your orders now. 🛍️" : (closeMsg || "The store is currently closed. Stay tuned!"));
    toast.success(open ? 'Store opened!' : 'Store closed!');
  };

  const memberAdminPrintEarnings = stats.printRevenue - stats.printCommission;
  const memberAdminTotalEarnings = memberAdminPrintEarnings + stats.memberAdminOrderCommission + stats.posMemberAdmin;
  const mainAdminTotalEarnings = stats.totalCommission + stats.printCommission + stats.posMainAdmin;

  return (
    <div className="space-y-3 pb-6">
      {/* Push Diagnostic Card */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm">Push Notification Status</span>
        </div>
        {pushStatus ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Permission:</span>
              <span className={`font-bold ${pushStatus.permission === 'granted' ? 'text-success' : 'text-destructive'}`}>{pushStatus.permission.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Subscribed:</span>
              <span className={`font-bold ${pushStatus.isOptedIn ? 'text-success' : 'text-destructive'}`}>{pushStatus.isOptedIn ? 'YES' : 'NO'}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Linked to ID:</span>
              <span className="font-mono text-[9px]">{pushStatus.externalId || 'NOT LINKED'}</span>
            </div>
            {!pushStatus.isReady && (
              <p className="text-[9px] text-destructive font-bold mt-1">⚠️ Your device is not ready for alerts. Tap the bell icon or re-install the app.</p>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Checking status...</p>
        )}
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">Store Status</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${storeOpen ? 'bg-success/20 text-[hsl(var(--success))]' : 'bg-destructive/20 text-destructive'}`}>
              {storeOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <Switch checked={storeOpen} onCheckedChange={saveStore} />
        </div>
        <Input value={closeMsg} onChange={(e) => setCloseMsg(e.target.value)} placeholder="Close message..." className="text-xs"
          onBlur={() => {
            (supabase as any).from('app_settings').update({
              value: { is_open: storeOpen, close_message: closeMsg }
            }).eq('key', 'store_status');
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Products", value: stats.products, color: "text-primary" },
          { label: "Users", value: stats.users, color: "text-secondary" },
          { label: "Pending GCash", value: stats.pendingGcash, color: "text-warning" },
          { label: "Club Members", value: stats.activeMembers, color: "text-[hsl(var(--success))]" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-3 border border-border text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-4 text-center text-white shadow-lg">
        <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">Total Main Admin Earnings</p>
        <p className="text-3xl font-extrabold">₱{mainAdminTotalEarnings.toFixed(2)}</p>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-2">👥 Member Admin Shared Account</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Orders</p>
            <p className="text-xs font-bold">₱{stats.memberAdminOrderCommission.toFixed(2)}</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-[9px] text-muted-foreground">Print</p>
            <p className="text-xs font-bold">₱{memberAdminPrintEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-[9px] text-muted-foreground">POS</p>
            <p className="text-xs font-bold">₱{stats.posMemberAdmin.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-center text-sm font-extrabold text-primary mt-3">Total: ₱{memberAdminTotalEarnings.toFixed(2)}</p>
      </div>
    </div>
  );
}

/* ─── Orders Tab ─── */
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (order: any, status: string) => {
    const { error } = await (supabase as any).from('orders').update({ status }).eq('id', order.id);
    if (error) { toast.error(error.message); return; }
    
    notifyOrderUpdate(order.user_id, order.id, status);
    sendTelegramOrderNotify(status, order);
    
    if (status === 'completed') {
      // Award BCoins
      const { data: wallet } = await (supabase as any).from('bcoins_wallets').select('*').eq('user_id', order.user_id).maybeSingle();
      const amount = Number(order.bcoins_earned || 0);
      if (wallet) {
        await (supabase as any).from('bcoins_wallets').update({ balance: Number(wallet.balance) + amount }).eq('user_id', order.user_id);
      } else {
        await (supabase as any).from('bcoins_wallets').insert({ user_id: order.user_id, balance: amount });
      }
      await (supabase as any).from('bcoins_transactions').insert({ user_id: order.user_id, amount, type: 'earn_purchase', description: `Earned from order #${order.id.slice(0,8)}` });
      notifyCustomerBCoins(order.user_id, amount, "your purchase");
    }

    toast.success(`Order ${status}!`);
    load();
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Recent Orders</h3>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}><RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>
      {orders.map(o => (
        <div key={o.id} className="bg-card border border-border rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold">Order #{o.id.slice(0,8)}</p>
              <p className="text-[10px] text-muted-foreground">{o.customer_name} • {o.customer_section}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              o.status === 'pending' ? 'bg-warning/20 text-warning' :
              o.status === 'completed' ? 'bg-success/20 text-[hsl(var(--success))]' :
              'bg-primary/20 text-primary'
            }`}>{o.status.toUpperCase()}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {o.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(", ")}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="font-extrabold text-sm text-primary">₱{Number(o.total).toFixed(2)}</span>
            <div className="flex gap-1">
              {o.status === 'pending' && (
                <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(o, 'approved')}>Approve</Button>
              )}
              {o.status === 'approved' && (
                <Button size="sm" className="h-7 text-[10px] bg-blue-600" onClick={() => updateStatus(o, 'ready')}>Ready</Button>
              )}
              {o.status === 'ready' && (
                <Button size="sm" className="h-7 text-[10px] bg-green-600" onClick={() => updateStatus(o, 'completed')}>Complete</Button>
              )}
              {o.status !== 'completed' && o.status !== 'rejected' && (
                <Button size="sm" variant="destructive" className="h-7 text-[10px]" onClick={() => updateStatus(o, 'rejected')}>Reject</Button>
              )}
            </div>
          </div>
        </div>
      ))}
      {orders.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">No orders found</p>}
    </div>
  );
}

/* ─── Print Orders Tab ─── */
function PrintOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('print_orders').select('*, profile:profiles!print_orders_user_id_fkey(*)').order('created_at', { ascending: false }).limit(50);
    setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (order: any, status: string) => {
    await (supabase as any).from('print_orders').update({ status }).eq('id', order.id);
    notifyCustomerPrintStatus(order.user_id, order.file_name, status);
    toast.success(`Print request ${status}`);
    load();
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Print Requests</h3>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}><RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>
      {orders.map(o => (
        <div key={o.id} className="bg-card border border-border rounded-xl p-3 space-y-2">
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">{o.file_name}</p>
              <p className="text-[10px] text-muted-foreground">{o.profile?.first_name} {o.profile?.last_name} • {o.page_size}</p>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              o.status === 'pending' ? 'bg-warning/20 text-warning' :
              o.status === 'confirmed' ? 'bg-success/20 text-[hsl(var(--success))]' :
              'bg-primary/20 text-primary'
            }`}>{o.status.toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="font-extrabold text-sm text-primary">₱{Number(o.cost).toFixed(2)}</span>
            <div className="flex gap-1">
              {o.status === 'pending' && (
                <Button size="sm" className="h-7 text-[10px]" onClick={() => updateStatus(o, 'approved')}>Approve</Button>
              )}
              {o.status === 'approved' && (
                <Button size="sm" className="h-7 text-[10px] bg-green-600" onClick={() => updateStatus(o, 'confirmed')}>Confirm Paid</Button>
              )}
              {o.status !== 'confirmed' && o.status !== 'rejected' && (
                <Button size="sm" variant="destructive" className="h-7 text-[10px]" onClick={() => updateStatus(o, 'rejected')}>Reject</Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Products Tab ─── */
function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: '', name: '', price: 0, original_price: '', image: '', category: '', rating: 4.5, sold: 0, stock: 0, description: '', is_flash_sale: false });

  const load = useCallback(() => {
    (supabase as any).from('products').select('*').order('created_at', { ascending: false }).then(({ data }: any) => setProducts(data || []));
  }, []);

  useEffect(load, [load]);

  const syncDefaults = async () => {
    setSyncing(true);
    try {
      const { error } = await (supabase as any).from('products').upsert(
        defaultProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          original_price: p.originalPrice || null,
          image: p.image,
          category: p.category,
          rating: p.rating,
          sold: p.sold,
          stock: p.stock || 50,
          description: p.description,
          is_flash_sale: p.isFlashSale || false,
          is_active: true
        }))
      );
      if (error) throw error;
      toast.success("Default products synced to database!");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSyncing(false);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      price: form.price,
      original_price: form.original_price ? Number(form.original_price) : null,
      image: form.image.trim(),
      category: form.category.trim(),
      rating: form.rating,
      sold: form.sold,
      stock: form.stock,
      description: form.description.trim(),
      is_flash_sale: form.is_flash_sale,
      is_active: true
    };
    if (editId) {
      await (supabase as any).from('products').update(payload).eq('id', editId);
    } else {
      await (supabase as any).from('products').insert({ ...payload, id: `p-${Date.now()}` });
    }
    resetForm(); setShowForm(false); setEditId(null); load();
    toast.success("Saved!");
  };

  const resetForm = () => setForm({ id: '', name: '', price: 0, original_price: '', image: '', category: '', rating: 4.5, sold: 0, stock: 0, description: '', is_flash_sale: false });
  const edit = (p: any) => { setForm({ ...p, original_price: p.original_price || '' }); setEditId(p.id); setShowForm(true); };
  const remove = async (id: string) => { await (supabase as any).from('products').delete().eq('id', id); load(); toast.success("Deleted"); };

  return (
    <div className="space-y-3 pb-6">
      <div className="flex gap-2">
        <Button onClick={() => { resetForm(); setEditId(null); setShowForm(!showForm); }} size="sm" className="flex-1 gap-1">
          <Plus className="h-3 w-3" />{showForm ? 'Cancel' : 'Add Product'}
        </Button>
        <Button onClick={syncDefaults} disabled={syncing} variant="outline" size="sm" className="flex-1 gap-1">
          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} /> Sync Defaults
        </Button>
      </div>
      {showForm && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Name" className="text-xs h-8" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="Price" className="text-xs h-8" />
            <Input type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} placeholder="Stock" className="text-xs h-8" />
          </div>
          <Input value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="Image URL" className="text-xs h-8" />
          <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Category" className="text-xs h-8" />
          <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="text-xs" rows={2} />
          <Button onClick={save} size="sm" className="w-full">Save Product</Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {products.map(p => (
          <div key={p.id} className="bg-card rounded-lg p-2 border border-border flex items-center gap-2">
            <img src={p.image} className="h-10 w-10 rounded object-cover" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">₱{p.price} · Stock: {p.stock}</p>
            </div>
            <button onClick={() => edit(p)} className="p-1 text-primary"><Edit2 className="h-3 w-3" /></button>
            <button onClick={() => remove(p.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Admin Dashboard ─── */
export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    
    if (user.email === 'sheethappenswithjaa@gmail.com') {
      setRole('main_admin');
      setLoading(false);
      return;
    }

    (supabase as any).rpc('get_user_role', { _user_id: user.id })
      .then(({ data, error }: any) => {
        if (!data || error) { navigate("/"); return; }
        setRole(data);
        setLoading(false);
      });
  }, [user, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!role) return null;

  const isMainAdmin = role === 'main_admin';
  const initialTab = searchParams.get("tab") || "overview";

  const tabs = [
    { value: "overview", label: "Overview", icon: Store, show: true },
    { value: "pos", label: "POS", icon: Receipt, show: true },
    { value: "orders", label: "Orders", icon: ShoppingCart, show: true },
    { value: "print", label: "Print", icon: Printer, show: true },
    { value: "jobs", label: "Jobs", icon: Briefcase, show: true },
    { value: "messages", label: "Messages", icon: MessageCircle, show: true },
    { value: "codes", label: "Codes", icon: Tag, show: true },
    { value: "gcash", label: "GCash", icon: Smartphone, show: true },
    { value: "club", label: "Club", icon: Crown, show: true },
    { value: "news", label: "News", icon: Megaphone, show: true },
    { value: "products", label: "Products", icon: Package, show: isMainAdmin },
  ].filter(t => t.show);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-secondary text-secondary-foreground px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="p-0.5"><ArrowLeft className="h-5 w-5" /></button>
          <Shield className="h-5 w-5" />
          <span className="font-extrabold text-sm">BizMart Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-secondary-foreground/20 px-2 py-0.5 rounded-full font-bold">{isMainAdmin ? 'Main Admin' : 'Member'}</span>
          <button onClick={async () => { await signOut(); navigate("/login"); }} className="p-1.5 hover:bg-white/10 rounded-full"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="mt-3">
        <div className="px-3 overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex gap-1 bg-transparent h-auto p-0 mb-3 pr-6">
            {tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="flex-shrink-0 whitespace-nowrap text-[11px] px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border border-border">
                <t.icon className="h-3 w-3 mr-1" />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="px-3">
          <TabsContent value="overview"><OverviewTab role={role!} /></TabsContent>
          <TabsContent value="pos"><POSTab role={role!} onSaleComplete={() => {}} /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="print"><PrintOrdersTab /></TabsContent>
          <TabsContent value="jobs"><AdminJobsTab /></TabsContent>
          <TabsContent value="messages"><AdminMessagesTab /></TabsContent>
          <TabsContent value="codes"><CodesTab role={role!} /></TabsContent>
          <TabsContent value="gcash"><GCashTab /></TabsContent>
          <TabsContent value="club"><ClubTab /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

/* ─── Admin Jobs Tab ─── */
function AdminJobsTab() {
  const [applications, setApplications] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  const load = useCallback(async () => {
    const { data: apps } = await (supabase as any)
      .from("freelancer_profiles")
      .select("*, profile:profiles!freelancer_profiles_user_id_fkey(*)")
      .order("created_at", { ascending: false });
    setApplications(apps || []);

    const { data: jobs } = await (supabase as any)
      .from("job_postings")
      .select("*, client:profiles!job_postings_client_id_fkey(*)")
      .neq("status", "completed")
      .order("created_at", { ascending: false });
    setActiveJobs(jobs || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateApp = async (id: string, status: string) => {
    await (supabase as any).from("freelancer_profiles").update({ status }).eq("id", id);
    load();
    toast.success(`Application ${status}`);
  };

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Freelancer Applications
        </h3>
        <div className="space-y-2">
          {applications.filter(a => a.status === 'pending').map(app => (
            <div key={app.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-bold">{app.profile?.first_name} {app.profile?.last_name}</p>
                  <p className="text-[10px] text-muted-foreground">{app.profile?.email}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 text-[10px]" onClick={() => updateApp(app.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="destructive" className="h-7 text-[10px]" onClick={() => updateApp(app.id, 'rejected')}>Reject</Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2"><strong>Strengths:</strong> {app.academic_strengths}</p>
              <p className="text-[10px] text-muted-foreground mt-1"><strong>Subjects:</strong> {app.subjects?.join(", ")}</p>
            </div>
          ))}
          {applications.filter(a => a.status === 'pending').length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">No pending applications</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" /> Active Job Offers
        </h3>
        <div className="space-y-2">
          {activeJobs.map(job => (
            <div key={job.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold truncate max-w-[150px]">{job.title}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  job.status === 'open' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>{job.status.toUpperCase()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Client: {job.client?.first_name} {job.client?.last_name}</p>
              <p className="text-[10px] text-muted-foreground">Rate: ₱{job.hourly_rate}/hr | Category: {job.category}</p>
            </div>
          ))}
          {activeJobs.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">No active jobs</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── GCash Tab ─── */
function GCashTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fee, setFee] = useState(10);

  const load = useCallback(() => {
    (supabase as any).from('gcash_transactions').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }: any) => setTransactions(data || []));
    (supabase as any).from('app_settings').select('*').eq('key', 'gcash_service_fee').single()
      .then(({ data }: any) => { if (data) setFee(data.value.amount); });
  }, []);

  useEffect(load, [load]);

  const updateStatus = async (id: string, status: string) => {
    const tx = transactions.find(t => t.id === id);
    await (supabase as any).from('gcash_transactions').update({ status }).eq('id', id);
    if (tx) {
      notifyCustomerGCashComplete(tx.user_id, tx.type, tx.amount, status);
    }
    load(); toast.success(`Transaction ${status}`);
  };

  const saveFee = async () => {
    await (supabase as any).from('app_settings').update({ value: { amount: fee } }).eq('key', 'gcash_service_fee');
    toast.success("Service fee updated!");
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
        <Label className="text-xs font-bold whitespace-nowrap">Service Fee ₱</Label>
        <Input type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} className="w-20 text-sm" />
        <Button onClick={saveFee} size="sm">Save</Button>
      </div>
      {transactions.map(tx => (
        <div key={tx.id} className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-xs">{tx.type === 'cash_in' ? '💰 Cash In' : '💸 Cash Out'} — ₱{tx.amount}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              tx.status === 'pending' ? 'bg-warning/20 text-warning' :
              tx.status === 'completed' ? 'bg-success/20 text-[hsl(var(--success))]' :
              'bg-destructive/20 text-destructive'
            }`}>{tx.status}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Ref: {tx.reference_number} | GCash: {tx.gcash_number}</p>
          {tx.status === 'pending' && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => updateStatus(tx.id, 'completed')}>
                <Check className="h-3 w-3" />Approve
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1" onClick={() => updateStatus(tx.id, 'rejected')}>
                <X className="h-3 w-3" />Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Club Tab ─── */
function ClubTab() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    const { data: memData } = await (supabase as any).from('club_memberships').select('*').order('created_at', { ascending: false });
    setMemberships(memData || []);
    const userIds = (memData || []).map((m: any) => m.user_id);
    if (userIds.length > 0) {
      const { data: profs } = await (supabase as any).from('profiles').select('*').in('user_id', userIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setMemberProfiles(map);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3 pb-6">
      <h3 className="font-bold text-sm">Active Memberships</h3>
      <div className="space-y-2">
        {memberships.map(m => {
          const prof = memberProfiles[m.user_id];
          return (
            <div key={m.id} className="bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{prof ? `${prof.first_name} ${prof.last_name}` : 'Unknown'}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.membership_type === 'premium' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                  {m.membership_type === 'premium' ? '⭐ Premium' : 'Standard'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">📧 {prof?.email}</p>
              <p className="text-[10px] text-muted-foreground">🎓 {prof?.grade_level} - {prof?.section}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}