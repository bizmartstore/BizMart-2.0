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
  Package, Users, Image, Tag, Smartphone, Store, LogOut, Edit2, Coins, Bell, ShoppingCart, Printer, Settings, UserPlus, Receipt, Download, MessageCircle, Briefcase
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
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Jobs Tab ─── */
function AdminJobsTab() {
  const [applications, setApplications] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  const load = async () => {
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
  };

  useEffect(() => { load(); }, []);

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
  const [codes, setCodes] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, any>>({});
  const [newCode, setNewCode] = useState("");

  const load = async () => {
    const { data: codeData } = await (supabase as any).from('club_codes').select('*').eq('is_used', false).order('created_at', { ascending: false });
    setCodes(codeData || []);
    const { data: memData } = await (supabase as any).from('club_memberships').select('*').order('created_at', { ascending: false });
    setMemberships(memData || []);
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
      <div className="mt-1 space-y-2">
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
    } else {
      await (supabase as any).from('products').insert(payload);
    }
    resetForm(); setShowForm(false); setEditId(null); load();
    toast.success("Saved!");
  };

  const resetForm = () => setForm({ id: '', name: '', price: 0, original_price: '', image: '', category: '', rating: 4.5, sold: 0, stock: 0, description: '', is_flash_sale: false });
  const edit = (p: any) => { setForm({ ...p, original_price: p.original_price || '' }); setEditId(p.id); setShowForm(true); };
  const remove = async (id: string) => { await (supabase as any).from('products').delete().eq('id', id); load(); toast.success("Deleted"); };

  return (
    <div className="space-y-3 pb-6">
      <Button onClick={() => { resetForm(); setEditId(null); setShowForm(!showForm); }} size="sm" className="gap-1">
        <Plus className="h-3 w-3" />{showForm ? 'Cancel' : 'Add Product'}
      </Button>
      {showForm && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Name" className="text-xs h-8" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="Price" className="text-xs h-8" />
            <Input type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} placeholder="Stock" className="text-xs h-8" />
          </div>
          <Button onClick={save} size="sm" className="w-full">Save Product</Button>
        </div>
      )}
      {products.map(p => (
        <div key={p.id} className="bg-card rounded-lg p-2 border border-border flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{p.name}</p>
            <p className="text-[10px] text-muted-foreground">₱{p.price} · Stock: {p.stock}</p>
          </div>
          <button onClick={() => edit(p)} className="p-1 text-primary"><Edit2 className="h-3 w-3" /></button>
          <button onClick={() => remove(p.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
        </div>
      ))}
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!role) return null;

  const isMainAdmin = role === 'main_admin';

  const tabs = [
    { value: "overview", label: "Overview", icon: Store, show: true },
    { value: "pos", label: "POS", icon: Receipt, show: true },
    { value: "orders", label: "Orders", icon: ShoppingCart, show: true },
    { value: "print", label: "Print", icon: Printer, show: true },
    { value: "jobs", label: "Jobs", icon: Briefcase, show: true },
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
          <span className="text-[10px] bg-secondary-foreground/20 px-2 py-0.5 rounded-full font-bold">{isMainAdmin ? 'Main Admin' : 'Member'}</span>
          <button onClick={async () => { await signOut(); navigate("/login"); }}><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-3">
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
          <TabsContent value="pos"><POSTab role={role!} /></TabsContent>
          <TabsContent value="orders"><OrdersTab role={role!} /></TabsContent>
          <TabsContent value="print"><PrintOrdersTab role={role!} /></TabsContent>
          <TabsContent value="jobs"><AdminJobsTab /></TabsContent>
          <TabsContent value="messages"><AdminMessagesTab /></TabsContent>
          <TabsContent value="codes"><CodesTab role={role!} /></TabsContent>
          {isMainAdmin && <TabsContent value="sellers"><SellersTab /></TabsContent>}
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsTab /></TabsContent>
          <TabsContent value="news"><NewsTab /></TabsContent>
          <TabsContent value="gcash"><GCashTab /></TabsContent>
          <TabsContent value="club"><ClubTab /></TabsContent>
          {isMainAdmin && <TabsContent value="products"><ProductsTab /></TabsContent>}
        </div>
      </Tabs>
    </div>
  );
}