import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Package, Users, Image, Tag, Smartphone, Store, LogOut, Edit2, Coins, Bell, ShoppingCart, Printer, Settings, UserPlus, Receipt, Download, MessageCircle
} from "lucide-react";
import POSTab from "@/components/admin/POSTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notifyCustomerGCashComplete, notifyCustomerRedemptionStatus, notifyCustomerOrder, notifyCustomerBCoins, notifyAnnouncement, notifyCustomerPrintStatus, notifyCustomerOrderApproval } from "@/lib/notifications";
import { sendTelegramOrderNotify } from "@/lib/telegramNotify";
import CodesTab from "@/components/admin/CodesTab";
import NewsTab from "@/components/admin/NewsTab";
import AdminMessagesTab from "@/components/admin/AdminMessagesTab";

/* ─── Overview Tab ─── */
function OverviewTab({ role }: { role: string }) {
  const isMainAdmin = role === 'main_admin';
  const [storeOpen, setStoreOpen] = useState(true);
  const [closeMsg, setCloseMsg] = useState("Store is currently closed.");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [stats, setStats] = useState({ products: 0, users: 0, pendingGcash: 0, activeMembers: 0, totalCommission: 0, memberAdminOrderCommission: 0, printRevenue: 0, printCommission: 0, posSales: 0, posMainAdmin: 0, posMemberAdmin: 0, posSeller: 0 });

  useEffect(() => {
    (supabase as any).from('app_settings').select('*').eq('key', 'store_status').single()
      .then(({ data }: any) => {
        if (data) { setStoreOpen(data.value.is_open); setCloseMsg(data.value.close_message || ''); }
      });
    (supabase as any).from('app_settings').select('*').eq('key', 'admin_push_enabled').maybeSingle()
      .then(({ data }: any) => {
        if (data) setPushEnabled(data.value?.enabled !== false);
      });
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

  const saveStore = async (open: boolean) => {
    setStoreOpen(open);
    await (supabase as any).from('app_settings').update({
      value: { is_open: open, close_message: closeMsg }, updated_at: new Date().toISOString()
    }).eq('key', 'store_status');
    
    // Push notification to all customers
    const { sendNotification } = await import("@/lib/notifications");
    sendNotification({
      title: open ? "🟢 BizMart Store is Now OPEN!" : "🔴 BizMart Store is Now CLOSED",
      message: open ? "The store is open! Browse and place your orders now. 🛍️" : (closeMsg || "The store is currently closed. Stay tuned!"),
      icon: open ? "🟢" : "🔴",
      link: "/",
      type: "store_status",
    });
    
    toast.success(open ? 'Store opened!' : 'Store closed!');
  };

  const togglePush = async (enabled: boolean) => {
    setPushEnabled(enabled);
    const { data: existing } = await (supabase as any).from('app_settings').select('*').eq('key', 'admin_push_enabled').maybeSingle();
    if (existing) {
      await (supabase as any).from('app_settings').update({ value: { enabled }, updated_at: new Date().toISOString() }).eq('key', 'admin_push_enabled');
    } else {
      await (supabase as any).from('app_settings').insert({ key: 'admin_push_enabled', value: { enabled } });
    }
    toast.success(enabled ? 'Push notifications enabled!' : 'Push notifications disabled!');
  };

  const memberAdminPrintEarnings = stats.printRevenue - stats.printCommission;
  const memberAdminTotalEarnings = memberAdminPrintEarnings + stats.memberAdminOrderCommission + stats.posMemberAdmin;
  const mainAdminTotalEarnings = stats.totalCommission + stats.printCommission + stats.posMainAdmin;

  return (
    <div className="space-y-3 pb-6">
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

      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <div>
              <span className="font-bold text-sm">Push Notifications</span>
              <p className="text-[10px] text-muted-foreground">Receive order alerts even when app is closed</p>
            </div>
          </div>
          <Switch checked={pushEnabled} onCheckedChange={togglePush} />
        </div>
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

      {/* Role-specific earnings */}
      {isMainAdmin ? (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-center">
              <p className="text-[9px] text-muted-foreground font-bold uppercase">Orders (10%)</p>
              <p className="text-lg font-extrabold text-primary">₱{stats.totalCommission.toFixed(2)}</p>
            </div>
            <div className="bg-warning/10 rounded-xl p-3 border border-warning/20 text-center">
              <p className="text-[9px] text-muted-foreground font-bold uppercase">Print (50%)</p>
              <p className="text-lg font-extrabold text-warning">₱{stats.printCommission.toFixed(2)}</p>
            </div>
            <div className="bg-accent rounded-xl p-3 border border-border text-center">
              <p className="text-[9px] text-muted-foreground font-bold uppercase">POS</p>
              <p className="text-lg font-extrabold text-foreground">₱{stats.posMainAdmin.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-4 text-center">
            <p className="text-[10px] text-primary-foreground/80 font-bold uppercase">Total Main Admin Earnings</p>
            <p className="text-3xl font-extrabold text-primary-foreground">₱{mainAdminTotalEarnings.toFixed(2)}</p>
          </div>
          {/* Member Admin Shared Account */}
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">👥 Member Admin Shared Account</p>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">Order 10%</p>
                <p className="text-sm font-extrabold text-foreground">₱{stats.memberAdminOrderCommission.toFixed(2)}</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">Print 50%</p>
                <p className="text-sm font-extrabold text-foreground">₱{memberAdminPrintEarnings.toFixed(2)}</p>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">POS</p>
                <p className="text-sm font-extrabold text-foreground">₱{stats.posMemberAdmin.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-center text-sm font-extrabold text-primary mt-2">Total: ₱{memberAdminTotalEarnings.toFixed(2)}</p>
            <p className="text-[9px] text-muted-foreground text-center mt-0.5">Shared across all member admins as 1 sales account</p>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-primary/10 rounded-xl p-3 border border-primary/20 text-center">
              <p className="text-[9px] text-muted-foreground font-bold uppercase">Order 10%</p>
              <p className="text-lg font-extrabold text-primary">₱{stats.memberAdminOrderCommission.toFixed(2)}</p>
            </div>
            <div className="bg-[hsl(var(--success))]/10 rounded-xl p-3 border border-[hsl(var(--success))]/20 text-center">
              <p className="text-[9px] text-muted-foreground font-bold uppercase">Print 50%</p>
              <p className="text-lg font-extrabold text-[hsl(var(--success))]">₱{memberAdminPrintEarnings.toFixed(2)}</p>
            </div>
            <div className="bg-accent rounded-xl p-3 border border-border text-center">
              <p className="text-[9px] text-muted-foreground font-bold uppercase">POS</p>
              <p className="text-lg font-extrabold text-foreground">₱{stats.posMemberAdmin.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-4 text-center">
            <p className="text-[10px] text-primary-foreground/80 font-bold uppercase">Member Admin Shared Account</p>
            <p className="text-3xl font-extrabold text-primary-foreground">₱{memberAdminTotalEarnings.toFixed(2)}</p>
            <p className="text-[10px] text-primary-foreground/60 mt-1">10% from orders + 50% print + POS • Shared as 1 account</p>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Announcements Tab ─── */
function AnnouncementsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const { user } = useAuth();

  const load = () => {
    (supabase as any).from('announcements').select('*').order('created_at', { ascending: false })
      .then(({ data }: any) => setItems(data || []));
  };
  useEffect(load, []);

  const add = async () => {
    if (!title.trim() || !message.trim()) return;
    await (supabase as any).from('announcements').insert({ title: title.trim(), message: message.trim(), created_by: user?.id, is_active: true });
    // Push notification to all users
    notifyAnnouncement(title.trim(), message.trim());
    setTitle(""); setMessage(""); setShowAdd(false); load();
    toast.success("Announcement published!");
  };

  const toggle = async (id: string, active: boolean) => {
    await (supabase as any).from('announcements').update({ is_active: !active }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    await (supabase as any).from('announcements').delete().eq('id', id);
    load(); toast.success("Deleted");
  };

  return (
    <div className="space-y-3 pb-6">
      <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="gap-1">
        <Plus className="h-3 w-3" />{showAdd ? 'Cancel' : 'New Announcement'}
      </Button>
      {showAdd && (
        <div className="bg-card rounded-xl p-4 border border-border space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" className="text-sm font-bold" />
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." className="text-sm" rows={3} />
          <Button onClick={add} size="sm" className="w-full">Publish</Button>
        </div>
      )}
      {items.map(a => (
        <div key={a.id} className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`h-2 w-2 rounded-full ${a.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                <span className="text-[10px] text-muted-foreground">{a.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <h4 className="font-bold text-sm">{a.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => toggle(a.id, a.is_active)} className="p-1.5 rounded-lg bg-muted">
                {a.is_active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              </button>
              <button onClick={() => remove(a.id)} className="p-1.5 text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No announcements yet</p>}
    </div>
  );
}

/* ─── GCash Tab ─── */
function GCashTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fee, setFee] = useState(10);

  const load = () => {
    (supabase as any).from('gcash_transactions').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }: any) => setTransactions(data || []));
    (supabase as any).from('app_settings').select('*').eq('key', 'gcash_service_fee').single()
      .then(({ data }: any) => { if (data) setFee(data.value.amount); });
  };
  useEffect(load, []);

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
          <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
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
      {transactions.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No transactions</p>}
    </div>
  );
}

/* ─── Club Tab ─── */
function ClubTab() {
  const [codes, setCodes] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, any>>({});
  const [newCode, setNewCode] = useState("");

  const load = async () => {
    // Only show unused (available) codes
    const { data: codeData } = await (supabase as any).from('club_codes').select('*').eq('is_used', false).order('created_at', { ascending: false });
    setCodes(codeData || []);

    const { data: memData } = await (supabase as any).from('club_memberships').select('*').order('created_at', { ascending: false });
    setMemberships(memData || []);

    // Fetch profiles for all members
    const userIds = (memData || []).map((m: any) => m.user_id);
    if (userIds.length > 0) {
      const { data: profs } = await (supabase as any).from('profiles').select('*').in('user_id', userIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setMemberProfiles(map);
    }
  };
  useEffect(() => { load(); }, []);

  const addCode = async () => {
    if (!newCode.trim()) return;
    await (supabase as any).from('club_codes').insert({ code: newCode.trim().toUpperCase() });
    setNewCode(""); load(); toast.success("Code added!");
  };

  const generateCodes = async () => {
    const batch = Array.from({ length: 5 }, () => `BZM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    await (supabase as any).from('club_codes').insert(batch.map(c => ({ code: c })));
    load(); toast.success("5 codes generated!");
  };

  const deleteCode = async (id: string) => {
    await (supabase as any).from('club_codes').delete().eq('id', id);
    load(); toast.success("Code removed");
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="bg-card rounded-xl p-3 border border-border space-y-2">
        <span className="font-bold text-sm">Manage Club Codes</span>
        <div className="flex gap-2">
          <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="Enter code" className="text-sm" />
          <Button onClick={addCode} size="sm">Add</Button>
        </div>
        <Button onClick={generateCodes} size="sm" variant="outline" className="w-full gap-1"><Plus className="h-3 w-3" />Generate 5 Random Codes</Button>
      </div>

      <div>
        <span className="font-bold text-sm">Available Codes ({codes.length})</span>
        <p className="text-[10px] text-muted-foreground mb-1">Used codes are automatically removed from this list</p>
        <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
          {codes.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 border border-border text-xs">
              <span className="font-mono font-bold">{c.code}</span>
              <div className="flex items-center gap-2">
                <span className="text-[hsl(var(--success))] font-bold">Available</span>
                <button onClick={() => deleteCode(c.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
          {codes.length === 0 && <p className="text-center text-[10px] text-muted-foreground py-3">No available codes. Generate or add new ones.</p>}
        </div>
      </div>

      <div>
        <span className="font-bold text-sm">Members ({memberships.length})</span>
        <div className="mt-1 space-y-2">
          {memberships.map(m => {
            const prof = memberProfiles[m.user_id];
            return (
              <div key={m.id} className="bg-card rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{prof ? `${prof.first_name} ${prof.last_name}` : 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.membership_type === 'premium' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}`}>
                      {m.membership_type === 'premium' ? '⭐ Premium' : 'Standard'}
                    </span>
                    <span className={`text-[10px] font-bold ${m.status === 'active' ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>{m.status}</span>
                  </div>
                </div>
                {prof && (
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p>📧 {prof.email}</p>
                    <p>🎓 {prof.grade_level} - {prof.section} | 🏫 {prof.school}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{m.control_number}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(m.membership_date).toLocaleDateString()} → {new Date(m.expiry_date).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
          {memberships.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No members yet</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Products Tab ─── */
function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: '', name: '', price: 0, original_price: '', image: '', category: '', rating: 4.5, sold: 0, stock: 0, description: '', is_flash_sale: false });

  const load = () => {
    (supabase as any).from('products').select('*').order('created_at', { ascending: false }).then(({ data }: any) => setProducts(data || []));
  };
  useEffect(load, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-products")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const resetForm = () => setForm({ id: '', name: '', price: 0, original_price: '', image: '', category: '', rating: 4.5, sold: 0, stock: 0, description: '', is_flash_sale: false });
  const u = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    if (!form.name.trim()) return;
    const payload = {
      id: form.id || `p-${Date.now()}`,
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
    };
    if (editId) {
      const { id, ...updatePayload } = payload;
      await (supabase as any).from('products').update(updatePayload).eq('id', editId);
      toast.success("Product updated!");
    } else {
      await (supabase as any).from('products').insert(payload);
      toast.success("Product added!");
    }
    resetForm(); setShowForm(false); setEditId(null); load();
  };

  const edit = (p: any) => {
    setForm({ id: p.id, name: p.name, price: Number(p.price), original_price: p.original_price || '', image: p.image, category: p.category, rating: Number(p.rating), sold: p.sold, stock: p.stock || 0, description: p.description, is_flash_sale: p.is_flash_sale });
    setEditId(p.id); setShowForm(true);
  };

  const remove = async (id: string) => {
    await (supabase as any).from('products').delete().eq('id', id);
    load(); toast.success("Deleted");
  };

  const toggleActive = async (id: string, active: boolean) => {
    await (supabase as any).from('products').update({ is_active: !active }).eq('id', id);
    load();
  };

  return (
    <div className="space-y-3 pb-6">
      <Button onClick={() => { resetForm(); setEditId(null); setShowForm(!showForm); }} size="sm" className="gap-1">
        <Plus className="h-3 w-3" />{showForm ? 'Cancel' : 'Add Product'}
      </Button>

      {showForm && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px]">Product ID</Label><Input value={form.id} onChange={e => u('id', e.target.value)} placeholder="auto" className="text-xs h-8" disabled={!!editId} /></div>
            <div><Label className="text-[10px]">Category</Label><Input value={form.category} onChange={e => u('category', e.target.value)} placeholder="pens" className="text-xs h-8" /></div>
          </div>
          <div><Label className="text-[10px]">Name</Label><Input value={form.name} onChange={e => u('name', e.target.value)} placeholder="Product name" className="text-xs h-8" /></div>
          <div className="grid grid-cols-4 gap-2">
            <div><Label className="text-[10px]">Price ₱</Label><Input type="number" value={form.price} onChange={e => u('price', Number(e.target.value))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Orig Price</Label><Input type="number" value={form.original_price} onChange={e => u('original_price', e.target.value)} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Stock</Label><Input type="number" value={form.stock} onChange={e => u('stock', Number(e.target.value))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Rating</Label><Input type="number" value={form.rating} onChange={e => u('rating', Number(e.target.value))} className="text-xs h-8" step="0.1" /></div>
          </div>
          <div><Label className="text-[10px]">Image URL</Label><Input value={form.image} onChange={e => u('image', e.target.value)} placeholder="https://..." className="text-xs h-8" /></div>
          <div><Label className="text-[10px]">Description</Label><Textarea value={form.description} onChange={e => u('description', e.target.value)} className="text-xs" rows={2} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_flash_sale} onCheckedChange={v => u('is_flash_sale', v)} />
            <Label className="text-xs">Flash Sale</Label>
          </div>
          <Button onClick={save} size="sm" className="w-full">{editId ? 'Update' : 'Add'} Product</Button>
        </div>
      )}

      <div className="space-y-1">
        {products.map(p => (
          <div key={p.id} className="bg-card rounded-lg p-2 border border-border flex items-center gap-2">
            {p.image && <img src={p.image} className="h-10 w-10 rounded object-cover flex-shrink-0" alt="" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">₱{p.price} · {p.category} · Stock: <span className={`font-bold ${(p.stock || 0) <= 0 ? 'text-destructive' : (p.stock || 0) <= 5 ? 'text-warning' : 'text-[hsl(var(--success))]'}`}>{p.stock || 0}</span></p>
            </div>
            <div className="flex gap-1 flex-shrink-0 items-center">
              <button onClick={() => toggleActive(p.id, p.is_active)} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${p.is_active ? 'bg-success/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}`}>
                {p.is_active ? 'ON' : 'OFF'}
              </button>
              <button onClick={() => edit(p)} className="p-1 text-primary"><Edit2 className="h-3 w-3" /></button>
              <button onClick={() => remove(p.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Categories Tab ─── */
function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ id: '', name: '', icon: '📦', sort_order: 0 });

  const load = () => {
    (supabase as any).from('categories').select('*').order('sort_order').then(({ data }: any) => setCategories(data || []));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      await (supabase as any).from('categories').update({ name: form.name.trim(), icon: form.icon, sort_order: form.sort_order }).eq('id', editId);
    } else {
      if (!form.id.trim()) return;
      await (supabase as any).from('categories').insert({ id: form.id.trim(), name: form.name.trim(), icon: form.icon, sort_order: form.sort_order });
    }
    setForm({ id: '', name: '', icon: '📦', sort_order: 0 }); setShowForm(false); setEditId(null); load();
    toast.success(editId ? "Updated!" : "Added!");
  };

  const edit = (c: any) => { setForm({ id: c.id, name: c.name, icon: c.icon, sort_order: c.sort_order }); setEditId(c.id); setShowForm(true); };
  const remove = async (id: string) => { await (supabase as any).from('categories').delete().eq('id', id); load(); toast.success("Deleted"); };
  const toggleActive = async (id: string, active: boolean) => { await (supabase as any).from('categories').update({ is_active: !active }).eq('id', id); load(); };

  return (
    <div className="space-y-3 pb-6">
      <Button onClick={() => { setEditId(null); setForm({ id: '', name: '', icon: '📦', sort_order: 0 }); setShowForm(!showForm); }} size="sm" className="gap-1">
        <Plus className="h-3 w-3" />{showForm ? 'Cancel' : 'Add Category'}
      </Button>
      {showForm && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          {!editId && <div><Label className="text-[10px]">ID (slug)</Label><Input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="e.g. snacks" className="text-xs h-8" /></div>}
          <div className="grid grid-cols-4 gap-2">
            <div><Label className="text-[10px]">Icon</Label><Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="text-xs h-8 text-center" /></div>
            <div className="col-span-2"><Label className="text-[10px]">Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="text-xs h-8" /></div>
          </div>
          <Button onClick={save} size="sm" className="w-full">{editId ? 'Update' : 'Add'}</Button>
        </div>
      )}
      {categories.map(c => (
        <div key={c.id} className="bg-card rounded-lg px-3 py-2 border border-border flex items-center gap-2">
          <span className="text-lg">{c.icon}</span>
          <div className="flex-1">
            <span className="text-xs font-bold">{c.name}</span>
            <span className="text-[10px] text-muted-foreground ml-1">({c.id})</span>
          </div>
          <button onClick={() => toggleActive(c.id, c.is_active)} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${c.is_active ? 'bg-success/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}`}>
            {c.is_active ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => edit(c)} className="p-1 text-primary"><Edit2 className="h-3 w-3" /></button>
          <button onClick={() => remove(c.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
        </div>
      ))}
    </div>
  );
}

/* ─── Banners Tab ─── */
function BannersTab() {
  const [banners, setBanners] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const load = () => {
    (supabase as any).from('banners').select('*').order('sort_order').then(({ data }: any) => setBanners(data || []));
  };
  useEffect(load, []);

  const add = async () => {
    if (!url.trim()) return;
    await (supabase as any).from('banners').insert({ image_url: url.trim(), title: title.trim(), sort_order: banners.length });
    setUrl(""); setTitle(""); load(); toast.success("Banner added!");
  };

  const remove = async (id: string) => {
    await (supabase as any).from('banners').delete().eq('id', id);
    load(); toast.success("Removed");
  };

  const toggleActive = async (id: string, active: boolean) => {
    await (supabase as any).from('banners').update({ is_active: !active }).eq('id', id);
    load();
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="bg-card rounded-xl p-3 border border-border space-y-2">
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="Banner image URL" className="text-xs h-8" />
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" className="text-xs h-8" />
        <Button onClick={add} size="sm" className="w-full gap-1"><Plus className="h-3 w-3" />Add Banner</Button>
      </div>
      {banners.map(b => (
        <div key={b.id} className="bg-card rounded-xl border border-border overflow-hidden">
          <img src={b.image_url} className="w-full aspect-[2/1] object-cover" alt={b.title} />
          <div className="p-2 flex items-center justify-between">
            <span className="text-xs font-bold truncate">{b.title || 'Untitled'}</span>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => toggleActive(b.id, b.is_active)} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${b.is_active ? 'bg-success/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}`}>
                {b.is_active ? 'ON' : 'OFF'}
              </button>
              <button onClick={() => remove(b.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── BCoins Tab ─── */
function BCoinsTab() {
  const [poolMax, setPoolMax] = useState(5000);
  const [totalEarned, setTotalEarned] = useState(0);
  const [addAmount, setAddAmount] = useState(0);
  const [newMax, setNewMax] = useState(0);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);

  const poolRemaining = Math.max(0, poolMax - totalEarned);

  const load = () => {
    // Get pool max from settings
    (supabase as any).from('app_settings').select('*').eq('key', 'bcoins_pool').single()
      .then(({ data }: any) => {
        if (data) {
          setPoolMax(data.value.max || 5000);
        }
      });
    // Calculate total earned BCoins across all wallets (this IS the distributed amount)
    (supabase as any).from('bcoins_wallets').select('balance').then(({ data }: any) => {
      const total = (data || []).reduce((sum: number, w: any) => sum + Number(w.balance || 0), 0);
      setTotalEarned(total);
    });
    (supabase as any).from('bcoins_redemptions').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }: any) => setRedemptions(data || []));
    (supabase as any).from('bcoins_wallets').select('*').order('balance', { ascending: false }).limit(50)
      .then(({ data }: any) => setWallets(data || []));
  };
  useEffect(load, []);

  const addToPool = async () => {
    if (addAmount <= 0) return;
    const newPoolMax = poolMax + addAmount;
    await (supabase as any).from('app_settings').update({ value: { max: newPoolMax, current: newPoolMax - totalEarned } }).eq('key', 'bcoins_pool');
    setPoolMax(newPoolMax);
    setAddAmount(0);
    toast.success(`Added ${addAmount} to pool cap! New max: ${newPoolMax}`);
  };

  const updatePoolMax = async () => {
    if (newMax <= 0) return;
    await (supabase as any).from('app_settings').update({ value: { max: newMax, current: newMax - totalEarned } }).eq('key', 'bcoins_pool');
    setPoolMax(newMax);
    setNewMax(0);
    toast.success(`Pool max set to ${newMax}`);
  };

  const updateRedemption = async (id: string, status: string) => {
    const r = redemptions.find(rd => rd.id === id);
    await (supabase as any).from('bcoins_redemptions').update({ status }).eq('id', id);
    if (r) {
      notifyCustomerRedemptionStatus(r.user_id, r.gcash_amount, status);
    }
    load();
    toast.success(`Redemption ${status}`);
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Pool Management */}
      <div className="bg-gradient-to-br from-[hsl(var(--warning))] to-[hsl(35,95%,45%)] rounded-xl p-4 text-primary-foreground">
        <span className="text-xs font-bold opacity-80">BCoins Pool (Auto-Updated)</span>
        <div className="text-3xl font-extrabold">{poolRemaining.toFixed(1)} <span className="text-sm opacity-70">/ {poolMax}</span></div>
        <p className="text-[10px] opacity-70 mt-0.5">{totalEarned.toFixed(1)} BCoins distributed to customers</p>
        <div className="mt-2 bg-primary-foreground/20 rounded-full h-2">
          <div className="bg-primary-foreground rounded-full h-2 transition-all" style={{ width: `${poolMax > 0 ? (poolRemaining / poolMax) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="bg-card rounded-xl p-3 border border-border space-y-2">
        <div className="flex gap-2 items-center">
          <Input type="number" value={addAmount || ''} onChange={e => setAddAmount(Number(e.target.value))} placeholder="Add to cap" className="text-sm w-24" />
          <Button onClick={addToPool} size="sm" className="gap-1"><Plus className="h-3 w-3" />Add to Pool</Button>
        </div>
        <div className="flex gap-2 items-center">
          <Input type="number" value={newMax || ''} onChange={e => setNewMax(Number(e.target.value))} placeholder="Set new max" className="text-sm w-24" />
          <Button onClick={updatePoolMax} size="sm" variant="outline" className="gap-1 text-xs">Set Max</Button>
        </div>
      </div>

      {/* Redemption requests */}
      <div>
        <span className="font-bold text-sm">Redemption Requests ({redemptions.length})</span>
        <div className="mt-1 space-y-1">
          {redemptions.map(r => (
            <div key={r.id} className="bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">₱{r.gcash_amount} GCash ({r.bcoins_amount} BCoins)</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  r.status === 'pending' ? 'bg-warning/20 text-warning' :
                  r.status === 'completed' ? 'bg-success/20 text-[hsl(var(--success))]' :
                  'bg-destructive/20 text-destructive'
                }`}>{r.status}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">GCash: {r.gcash_number} | {new Date(r.created_at).toLocaleString()}</p>
              {r.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => updateRedemption(r.id, 'completed')}>
                    <Check className="h-3 w-3" />Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1" onClick={() => updateRedemption(r.id, 'rejected')}>
                    <X className="h-3 w-3" />Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wallets overview */}
      <div>
        <span className="font-bold text-sm">User Wallets ({wallets.length})</span>
        <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
          {wallets.map(w => (
            <div key={w.id} className="bg-card rounded-lg px-3 py-2 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate">{w.user_id.slice(0, 8)}...</span>
              <span className="font-extrabold text-[hsl(var(--warning))]">{Number(w.balance).toFixed(1)} BCoins</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '',
    school: '', grade_level: '', section: '', role: 'none',
  });

  const load = async () => {
    const { data: profs } = await (supabase as any).from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(profs || []);
    const { data: roles } = await (supabase as any).from('user_roles').select('*');
    const roleMap: Record<string, string> = {};
    (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });
    setUserRoles(roleMap);
  };
  useEffect(() => { load(); }, []);

  const remove = async (userId: string) => {
    if (userId === user?.id) { toast.error("Cannot remove yourself"); return; }
    await (supabase as any).from('profiles').delete().eq('user_id', userId);
    load(); toast.success("User removed");
  };

  const createAccount = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Please fill in all required fields"); return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters"); return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: form.email.trim(),
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          school: form.school.trim(),
          grade_level: form.grade_level.trim(),
          section: form.section.trim(),
          role: form.role === 'none' ? null : form.role,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Account created for ${form.email}!`);
      setForm({ email: '', password: '', first_name: '', last_name: '', school: '', grade_level: '', section: '', role: 'none' });
      setShowCreate(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to create account");
    }
    setCreating(false);
  };

  const getRoleBadge = (userId: string) => {
    const role = userRoles[userId];
    if (role === 'main_admin') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive">Main Admin</span>;
    if (role === 'member_admin') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">Member Admin</span>;
    return null;
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{profiles.length} registered users</p>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="gap-1">
          <UserPlus className="h-3 w-3" />{showCreate ? 'Cancel' : 'Create Account'}
        </Button>
      </div>

      {showCreate && (
        <div className="bg-card rounded-xl p-4 border border-border space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" />Create New Account</h3>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px]">First Name *</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="Juan" className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Last Name *</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Dela Cruz" className="text-xs h-8" /></div>
          </div>
          <div><Label className="text-[10px]">Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@gmail.com" className="text-xs h-8" /></div>
          <div><Label className="text-[10px]">Password *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" className="text-xs h-8" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-[10px]">School</Label><Input value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} placeholder="School" className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Grade</Label><Input value={form.grade_level} onChange={e => setForm(f => ({ ...f, grade_level: e.target.value }))} placeholder="Grade" className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Section</Label><Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="Section" className="text-xs h-8" /></div>
          </div>
          <div>
            <Label className="text-[10px]">Role</Label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Customer (no admin role)</SelectItem>
                <SelectItem value="member_admin">Member Admin</SelectItem>
                <SelectItem value="main_admin">Main Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createAccount} disabled={creating} size="sm" className="w-full gap-1">
            <UserPlus className="h-3 w-3" />{creating ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
      )}

      {profiles.map(p => (
        <div key={p.id} className="bg-card rounded-lg px-3 py-2 border border-border flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {p.first_name?.[0]}{p.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold truncate">{p.first_name} {p.last_name}</p>
              {getRoleBadge(p.user_id)}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{p.email} · {p.grade_level} {p.section}</p>
          </div>
          {p.user_id !== user?.id && (
            <button onClick={() => remove(p.user_id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Notifications Tab ─── */
function NotificationsTab() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const load = () => {
    (supabase as any).from('notification_logs').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }: any) => setNotifications(data || []));
  };
  useEffect(load, []);

  // Realtime updates with admin sound
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notification_logs" }, async () => {
        load();
        // Play admin notification sound
        const { playAdminNotificationSound } = await import("@/lib/notificationSound");
        playAdminNotificationSound();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const clear = async () => {
    await (supabase as any).from('notification_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    load(); toast.success("Notifications cleared");
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">Recent Notifications ({notifications.length})</span>
        {notifications.length > 0 && (
          <Button onClick={clear} size="sm" variant="outline" className="text-[10px] h-7">Clear All</Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-8">No notifications yet</p>
      ) : (
        notifications.map(n => (
          <div key={n.id} className="bg-card rounded-xl p-3 border border-border">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-bold text-xs truncate">{n.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                    n.target_role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>{n.type}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{n.message}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ─── Orders Tab ─── */
function OrdersTab({ role }: { role: string }) {
  const isMainAdmin = role === 'main_admin';
  const [orders, setOrders] = useState<any[]>([]);

  const load = () => {
    (supabase as any).from('orders').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }: any) => setOrders(data || []));
  };
  useEffect(load, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateOrder = async (order: any, status: string) => {
    try {
      if (status === 'approved') {
        // Approve only (commissions calculated, NO stock deduction yet)
        const { error: approveError } = await (supabase as any).rpc('approve_order_with_stock', {
          _order_id: order.id,
        });
        if (approveError) throw approveError;
      } else if (status === 'completed') {
        // Complete = payment confirmed → deduct stock atomically
        const { error: completeError } = await (supabase as any).rpc('complete_order_with_stock', {
          _order_id: order.id,
        });
        if (completeError) throw completeError;
      } else {
        await (supabase as any)
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', order.id);
      }

      // Notify customer
      if (status === 'approved') {
        notifyCustomerOrderApproval(order.user_id, order.id, 'approved');
      } else if (status === 'completed') {
        notifyCustomerOrderApproval(order.user_id, order.id, 'completed');

        // Award BCoins on completion (paid)
        if (order.bcoins_earned > 0) {
          const { data: wallet } = await (supabase as any)
            .from('bcoins_wallets').select('*').eq('user_id', order.user_id).maybeSingle();

          if (wallet) {
            await (supabase as any).from('bcoins_wallets')
              .update({ balance: Number(wallet.balance) + Number(order.bcoins_earned), updated_at: new Date().toISOString() })
              .eq('user_id', order.user_id);
          } else {
            await (supabase as any).from('bcoins_wallets')
              .insert({ user_id: order.user_id, balance: Number(order.bcoins_earned) });
          }

          await (supabase as any).from('bcoins_transactions').insert({
            user_id: order.user_id,
            amount: Number(order.bcoins_earned),
            type: 'earn_purchase',
            description: `Purchase order ₱${Number(order.total).toLocaleString()}`,
          });

          notifyCustomerBCoins(order.user_id, Number(order.bcoins_earned), "your completed purchase");
        }
      } else if (status === 'rejected') {
        notifyCustomerOrderApproval(order.user_id, order.id, 'rejected');
      }

      // Send Telegram notification
      sendTelegramOrderNotify(status, order);

      load();
      toast.success(`Order ${status}`);
    } catch (error: any) {
      toast.error(error?.message || `Failed to update order to ${status}`);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/20 text-warning',
    approved: 'bg-success/20 text-[hsl(var(--success))]',
    ready: 'bg-primary/20 text-primary',
    completed: 'bg-success/20 text-[hsl(var(--success))]',
    rejected: 'bg-destructive/20 text-destructive',
  };

  const clearCompleted = async () => {
    const completedIds = orders.filter(o => o.status === 'completed').map(o => o.id);
    if (completedIds.length === 0) { toast("No completed orders to clear"); return; }
    const passcode = prompt("Enter admin passcode to clear completed orders:");
    if (passcode !== "PITF_0801") { toast.error("Invalid passcode"); return; }
    await (supabase as any).from('orders').update({ status: 'cleared' }).in('id', completedIds);
    load(); toast.success(`Cleared ${completedIds.length} completed orders`);
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">Orders ({orders.filter(o => o.status !== 'cleared').length})</span>
        {isMainAdmin && orders.some(o => o.status === 'completed') && (
          <Button onClick={clearCompleted} size="sm" variant="outline" className="text-[10px] h-7 gap-1">
            <Trash2 className="h-3 w-3" />Clear Completed
          </Button>
        )}
      </div>
      {orders.filter(o => o.status !== 'cleared').map(order => {
        const orderItems = order.items || [];
        return (
          <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  order.delivery_type === 'delivery' ? 'bg-primary/20 text-primary' : 'bg-accent text-accent-foreground'
                }`}>
                  {order.delivery_type === 'delivery' ? '🚚 Delivery' : '📦 Pickup'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[order.status] || ''}`}>
                {order.status}
              </span>
            </div>
            <div className="px-3 py-2">
              {/* Customer Details */}
              {order.customer_name && (
                <div className="bg-muted/50 rounded-lg p-2 mb-2 space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground">👤 {order.customer_name}</p>
                  {order.customer_section && <p className="text-[10px] text-muted-foreground">📚 Section: {order.customer_section}</p>}
                  {order.customer_grade_level && <p className="text-[10px] text-muted-foreground">🎓 Grade: {order.customer_grade_level}</p>}
                  {order.customer_contact && <p className="text-[10px] text-muted-foreground">📧 {order.customer_contact}</p>}
                </div>
              )}
              {order.pickup_date && (
                <p className="text-[10px] text-muted-foreground mb-1">📅 {order.pickup_date} at {order.pickup_time}</p>
              )}
              {orderItems.slice(0, 2).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  {item.image && <img src={item.image} className="h-8 w-8 rounded object-cover" alt="" />}
                  <span className="text-xs truncate flex-1">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">×{item.quantity}</span>
                </div>
              ))}
              {orderItems.length > 2 && <p className="text-[10px] text-muted-foreground">+{orderItems.length - 2} more</p>}
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <div>
                <span className="font-extrabold text-sm text-primary">₱{Number(order.total).toLocaleString()}</span>
                {Number(order.delivery_fee) > 0 && <span className="text-[10px] text-muted-foreground ml-1">(+₱{Number(order.delivery_fee)} delivery)</span>}
                <span className="text-[10px] text-muted-foreground ml-2">+{Number(order.bcoins_earned).toFixed(1)} BCoins</span>
              </div>
              {order.status === 'pending' && (
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => updateOrder(order, 'approved')}>
                    <Check className="h-3 w-3" />Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1" onClick={() => updateOrder(order, 'rejected')}>
                    <X className="h-3 w-3" />Reject
                  </Button>
                </div>
              )}
              {order.status === 'approved' && (
                <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => updateOrder(order, 'completed')}>
                  <Check className="h-3 w-3" />Complete
                </Button>
              )}
            </div>
            {/* Commission breakdown */}
            <div className="flex items-center justify-between px-3 pb-2">
              <p className="text-[9px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
              <div className="flex gap-2 flex-wrap">
                {Number(order.admin_commission) > 0 && (
                  <p className="text-[9px] text-primary font-bold">Main 10%: ₱{Number(order.admin_commission).toFixed(2)}</p>
                )}
                {Number(order.member_admin_commission) > 0 && (
                  <p className="text-[9px] text-secondary font-bold">Member 10%: ₱{Number(order.member_admin_commission).toFixed(2)}</p>
                )}
                {Number(order.seller_earnings) > 0 && (
                  <p className="text-[9px] text-[hsl(var(--success))] font-bold">Seller 80%: ₱{Number(order.seller_earnings).toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No orders yet</p>}
    </div>
  );
}

/* ─── Sellers Tab ─── */
function SellersTab() {
  const [applications, setApplications] = useState<any[]>([]);
  const [sellerCodes, setSellerCodes] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [newCode, setNewCode] = useState("");
  const [maxSellers, setMaxSellers] = useState(5);

  const load = () => {
    (supabase as any).from('seller_applications').select('*').order('created_at', { ascending: false }).then(({ data }: any) => setApplications(data || []));
    (supabase as any).from('seller_codes').select('*').order('created_at', { ascending: false }).then(({ data }: any) => setSellerCodes(data || []));
    (supabase as any).from('seller_profiles').select('*').order('created_at', { ascending: false }).then(({ data }: any) => setSellers(data || []));
    (supabase as any).from('app_settings').select('*').eq('key', 'max_sellers').maybeSingle().then(({ data }: any) => {
      if (data?.value?.max) setMaxSellers(data.value.max);
    });
  };
  useEffect(load, []);

  const updateApp = async (id: string, status: string) => {
    await (supabase as any).from('seller_applications').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    load(); toast.success(`Application ${status}`);
  };

  const addSellerCode = async () => {
    if (!newCode.trim()) return;
    await (supabase as any).from('seller_codes').insert({ code: newCode.trim().toUpperCase() });
    setNewCode(""); load(); toast.success("Seller code added!");
  };

  const generateSellerCodes = async () => {
    const batch = Array.from({ length: 3 }, () => `SELL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    await (supabase as any).from('seller_codes').insert(batch.map(c => ({ code: c })));
    load(); toast.success("3 seller codes generated!");
  };

  const saveMaxSellers = async () => {
    const { data: existing } = await (supabase as any).from('app_settings').select('*').eq('key', 'max_sellers').maybeSingle();
    if (existing) {
      await (supabase as any).from('app_settings').update({ value: { max: maxSellers } }).eq('key', 'max_sellers');
    } else {
      await (supabase as any).from('app_settings').insert({ key: 'max_sellers', value: { max: maxSellers } });
    }
    toast.success("Max sellers updated!");
  };

  const toggleSeller = async (id: string, active: boolean) => {
    await (supabase as any).from('seller_profiles').update({ is_active: !active }).eq('id', id);
    load();
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
        <Label className="text-xs font-bold whitespace-nowrap">Max Sellers</Label>
        <Input type="number" value={maxSellers} onChange={(e) => setMaxSellers(Number(e.target.value))} className="w-20 text-sm" />
        <Button onClick={saveMaxSellers} size="sm">Save</Button>
        <span className="text-[10px] text-muted-foreground">{sellers.length} active</span>
      </div>
      <div className="bg-card rounded-xl p-3 border border-border space-y-2">
        <span className="font-bold text-sm">Seller Codes</span>
        <div className="flex gap-2">
          <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="Enter code" className="text-sm" />
          <Button onClick={addSellerCode} size="sm">Add</Button>
        </div>
        <Button onClick={generateSellerCodes} size="sm" variant="outline" className="w-full gap-1"><Plus className="h-3 w-3" />Generate 3 Codes</Button>
        <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
          {sellerCodes.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-1.5 text-xs">
              <span className="font-mono font-bold">{c.code}</span>
              <span className={c.is_used ? 'text-muted-foreground' : 'text-[hsl(var(--success))] font-bold'}>{c.is_used ? 'Used' : 'Available'}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <span className="font-bold text-sm">Applications ({applications.length})</span>
        <div className="mt-1 space-y-2">
          {applications.map(a => (
            <div key={a.id} className="bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">{a.full_name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  a.status === 'approved' ? 'bg-success/20 text-[hsl(var(--success))]' :
                  a.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                  'bg-warning/20 text-warning'
                }`}>{a.status}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Business: {a.business_type}</p>
              <p className="text-[10px] text-muted-foreground">Products: {a.products_to_sell}</p>
              <p className="text-[10px] text-muted-foreground">Reason: {a.reason}</p>
              {a.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => updateApp(a.id, 'approved')}>
                    <Check className="h-3 w-3" />Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1" onClick={() => updateApp(a.id, 'rejected')}>
                    <X className="h-3 w-3" />Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <span className="font-bold text-sm">Active Sellers ({sellers.length})</span>
        <div className="mt-1 space-y-1">
          {sellers.map(s => (
            <div key={s.id} className="bg-card rounded-lg px-3 py-2 border border-border flex items-center gap-2">
              <Store className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{s.store_name || 'Unnamed'}</p>
                <p className="text-[10px] text-muted-foreground">{s.location || 'No location'}</p>
              </div>
              <button onClick={() => toggleSeller(s.id, s.is_active)} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.is_active ? 'bg-success/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}`}>
                {s.is_active ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Print Orders Tab ─── */
function PrintOrdersTab({ role }: { role: string }) {
  const isMainAdmin = role === 'main_admin';
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  const load = async () => {
    const { data } = await (supabase as any).from('print_orders').select('*').order('created_at', { ascending: false }).limit(100);
    setOrders(data || []);
    // Fetch profiles for all order owners
    const userIds = [...new Set((data || []).map((o: any) => o.user_id))];
    if (userIds.length > 0) {
      const { data: profs } = await (supabase as any).from('profiles').select('*').in('user_id', userIds);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
  };
  useEffect(() => { load(); }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("admin-print-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const order = orders.find(o => o.id === id);
    const updateData: any = { status, updated_at: new Date().toISOString() };

    // 50% of print service cost goes to main admin as commission
    if (status === 'approved' && order) {
      const maintenanceFee = Number((Number(order.cost) * 0.50).toFixed(2));
      updateData.maintenance_fee = maintenanceFee;
    }

    await (supabase as any).from('print_orders').update(updateData).eq('id', id);

    // Notify customer
    if (order) {
      notifyCustomerPrintStatus(order.user_id, order.file_name, status);
    }

    load(); toast.success(`Print order ${status}`);
  };

  const totalRevenue = orders.filter(o => o.status === 'confirmed').reduce((sum: number, o: any) => sum + Number(o.cost), 0);
  const totalMaintenance = orders.filter(o => o.status === 'confirmed').reduce((sum: number, o: any) => sum + Number(o.maintenance_fee), 0);
  const totalMemberAdminPrint = totalRevenue - totalMaintenance;

  const clearConfirmed = async () => {
    const confirmedIds = orders.filter(o => o.status === 'confirmed').map(o => o.id);
    if (confirmedIds.length === 0) { toast("No confirmed orders to clear"); return; }
    const passcode = prompt("Enter admin passcode to clear confirmed print orders:");
    if (passcode !== "PITF_0801") { toast.error("Invalid passcode"); return; }
    await (supabase as any).from('print_orders').update({ status: 'cleared' }).in('id', confirmedIds);
    load(); toast.success(`Cleared ${confirmedIds.length} confirmed print orders`);
  };

  return (
    <div className="space-y-3 pb-6">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-extrabold text-primary">₱{totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Total Print Revenue</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-extrabold text-warning">₱{totalMaintenance.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Maintenance (50%)</p>
        </div>
      </div>
      <div className="bg-card rounded-xl p-3 border border-border text-center">
        <p className="text-xl font-extrabold text-[hsl(var(--success))]">₱{totalMemberAdminPrint.toFixed(2)}</p>
        <p className="text-[10px] text-muted-foreground">Member Admin (50%)</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">Print Requests ({orders.filter(o => o.status !== 'cleared').length})</span>
        {isMainAdmin && orders.some(o => o.status === 'confirmed') && (
          <Button onClick={clearConfirmed} size="sm" variant="outline" className="text-[10px] h-7 gap-1">
            <Trash2 className="h-3 w-3" />Clear Confirmed
          </Button>
        )}
      </div>
      {orders.filter(o => o.status !== 'cleared').map(o => {
        const prof = profiles[o.user_id];
        return (
          <div key={o.id} className="bg-card rounded-xl p-3 border border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs truncate max-w-[150px]">{o.file_name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                o.status === 'confirmed' ? 'bg-success/20 text-[hsl(var(--success))]' :
                o.status === 'approved' ? 'bg-primary/20 text-primary' :
                o.status === 'rejected' || o.status === 'canceled' ? 'bg-destructive/20 text-destructive' :
                'bg-warning/20 text-warning'
              }`}>{o.status}</span>
            </div>
            {prof && (
              <div className="bg-muted/50 rounded-lg p-2 mb-1.5 space-y-0.5">
                <p className="text-[11px] font-bold text-foreground">👤 {prof.first_name} {prof.last_name}</p>
                <p className="text-[10px] text-muted-foreground">📧 {prof.email}</p>
                <p className="text-[10px] text-muted-foreground">🎓 {prof.grade_level} - {prof.section}</p>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>{o.total_pages} pages • {o.bw_pages} B&W • {o.colored_pages} Colored • {o.page_size}</p>
              <p>Cost: ₱{Number(o.cost).toFixed(2)} • Maintenance: ₱{Number(o.maintenance_fee).toFixed(2)}</p>
              {Number(o.delivery_fee) > 0 && <p>🚚 Delivery Fee: +₱{Number(o.delivery_fee).toFixed(2)}</p>}
              {o.pickup_date && <p>📅 {o.delivery_type === 'delivery' ? 'Delivery' : 'Pickup'}: {o.pickup_date} at {o.pickup_time}</p>}
              <p>{new Date(o.created_at).toLocaleString()}</p>
            </div>
            {/* Download & Print buttons */}
            {o.file_url && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={async () => {
                  const { data } = await supabase.storage.from('print-files').download(o.file_url);
                  if (data) {
                    const url = URL.createObjectURL(data);
                    const a = document.createElement('a');
                    a.href = url; a.download = o.file_name; a.click();
                    URL.revokeObjectURL(url);
                  } else { toast.error('Failed to download file'); }
                }}>
                  <Download className="h-3 w-3" />Download
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={async () => {
                  const { data } = await supabase.storage.from('print-files').download(o.file_url);
                  if (data) {
                    const url = URL.createObjectURL(data);
                    const printWindow = window.open(url);
                    if (printWindow) {
                      printWindow.onload = () => { printWindow.print(); };
                    }
                  } else { toast.error('Failed to load file for printing'); }
                }}>
                  <Printer className="h-3 w-3" />Print
                </Button>
              </div>
            )}
            {o.status === 'pending' && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => updateStatus(o.id, 'approved')}>
                  <Check className="h-3 w-3" />Approve
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-[11px] gap-1" onClick={() => updateStatus(o.id, 'rejected')}>
                  <X className="h-3 w-3" />Reject
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={() => updateStatus(o.id, 'canceled')}>
                  <X className="h-3 w-3" />Cancel
                </Button>
              </div>
            )}
            {o.status === 'approved' && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="h-7 text-[11px] gap-1" onClick={() => updateStatus(o.id, 'confirmed')}>
                  <Check className="h-3 w-3" />Confirm Done
                </Button>
              </div>
            )}
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No print orders yet</p>}
    </div>
  );
}

/* ─── Main Admin Dashboard ─── */
export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    (supabase as any).rpc('get_user_role', { _user_id: user.id })
      .then(({ data, error }: any) => {
        if (!data || error) { navigate("/"); return; }
        setRole(data);
        setLoading(false);
      });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!role) return null;

  const isMainAdmin = role === 'main_admin';

  const tabs = [
    { value: "overview", label: "Overview", icon: Store, show: true },
    { value: "pos", label: "POS", icon: Receipt, show: true },
    { value: "orders", label: "Orders", icon: ShoppingCart, show: true },
    { value: "print", label: "Print", icon: Printer, show: true },
    { value: "messages", label: "Messages", icon: MessageCircle, show: true },
    { value: "codes", label: "Codes", icon: Tag, show: true },
    { value: "sellers", label: "Sellers", icon: Settings, show: isMainAdmin },
    { value: "notifications", label: "Notifs", icon: Bell, show: true },
    { value: "announcements", label: "Announce", icon: Megaphone, show: true },
    { value: "news", label: "News", icon: Megaphone, show: true },
    { value: "gcash", label: "GCash", icon: Smartphone, show: true },
    { value: "bcoins", label: "BCoins", icon: Coins, show: isMainAdmin },
    { value: "club", label: "Club", icon: Crown, show: true },
    { value: "products", label: "Products", icon: Package, show: isMainAdmin },
    { value: "categories", label: "Categories", icon: Tag, show: isMainAdmin },
    { value: "banners", label: "Banners", icon: Image, show: isMainAdmin },
    { value: "users", label: "Users", icon: Users, show: isMainAdmin },
  ].filter(t => t.show);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-secondary text-secondary-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/")} className="p-0.5"><ArrowLeft className="h-5 w-5" /></button>
          <Shield className="h-5 w-5" />
          <span className="font-extrabold text-sm">BizMart Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-secondary-foreground/20 px-2 py-0.5 rounded-full font-bold">
            {isMainAdmin ? 'Main Admin' : 'Member'}
          </span>
          <button onClick={async () => { await signOut(); navigate("/login"); }}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-3">
        <div className="px-3 overflow-x-auto scrollbar-hide" style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" as any }}>
          <TabsList className="inline-flex gap-1 bg-transparent h-auto p-0 mb-3 pr-6">
            {tabs.map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex-shrink-0 whitespace-nowrap text-[11px] px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border border-border"
              >
                <t.icon className="h-3 w-3 mr-1" />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="px-3">

        <TabsContent value="overview"><OverviewTab role={role!} /></TabsContent>
        <TabsContent value="pos"><POSTab role={role!} /></TabsContent>
        <TabsContent value="orders"><OrdersTab role={role!} /></TabsContent>
        <TabsContent value="print"><PrintOrdersTab role={role!} /></TabsContent>
        <TabsContent value="messages"><AdminMessagesTab /></TabsContent>
        <TabsContent value="codes"><CodesTab role={role!} /></TabsContent>
        {isMainAdmin && <TabsContent value="sellers"><SellersTab /></TabsContent>}
        <TabsContent value="notifications"><NotificationsTab /></TabsContent>
        <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
        <TabsContent value="news"><NewsTab /></TabsContent>
        <TabsContent value="gcash"><GCashTab /></TabsContent>
        {isMainAdmin && <TabsContent value="bcoins"><BCoinsTab /></TabsContent>}
        <TabsContent value="club"><ClubTab /></TabsContent>
        {isMainAdmin && <TabsContent value="products"><ProductsTab /></TabsContent>}
        {isMainAdmin && <TabsContent value="categories"><CategoriesTab /></TabsContent>}
        {isMainAdmin && <TabsContent value="banners"><BannersTab /></TabsContent>}
        {isMainAdmin && <TabsContent value="users"><UsersTab /></TabsContent>}
        </div>
      </Tabs>
    </div>
  );
}
