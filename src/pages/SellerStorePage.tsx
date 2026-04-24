import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Store, ArrowLeft, Save, Image, MapPin, MessageSquare, Loader2, Package, TrendingUp, Upload, X } from "lucide-react";
import SellerProductsTab from "@/components/seller/SellerProductsTab";
import { useRef } from "react";

function StoreSettingsTab({ user }: { user: any }) {
  const [form, setForm] = useState({
    store_name: "", store_description: "", store_image: "", store_saying: "", location: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("seller_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => {
        if (data) setForm({
          store_name: data.store_name || "", store_description: data.store_description || "",
          store_image: data.store_image || "", store_saying: data.store_saying || "", location: data.location || "",
        });
      });
  }, [user]);

  const uploadStoreImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `stores/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("seller-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("seller-images").getPublicUrl(path);
      setForm(f => ({ ...f, store_image: publicUrl }));
      toast.success("Store image uploaded!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.store_name.trim()) { toast.error("Store name is required."); return; }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("seller_profiles").update({
        store_name: form.store_name.trim(), store_description: form.store_description.trim(),
        store_image: form.store_image.trim(), store_saying: form.store_saying.trim(),
        location: form.location.trim()
      }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Store updated! 🎉");
    } catch (e: any) { toast.error(e.message || "Failed to save."); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-br from-primary/20 to-accent relative overflow-hidden">
          {form.store_image ? <img src={form.store_image} alt="Store" className="w-full h-full object-cover" /> :
            <div className="flex items-center justify-center h-full"><Image className="h-8 w-8 text-muted-foreground/50" /></div>}
        </div>
        <div className="p-4">
          <h2 className="font-extrabold text-base text-foreground">{form.store_name || "Your Store Name"}</h2>
          {form.store_saying && <p className="text-xs text-primary italic mt-0.5">"{form.store_saying}"</p>}
          {form.location && <div className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">{form.location}</span></div>}
          {form.store_description && <p className="text-xs text-muted-foreground mt-2">{form.store_description}</p>}
        </div>
      </div>
      {/* Fields */}
      <div>
        <Label className="text-xs font-bold flex items-center gap-1 mb-1.5"><Store className="h-3 w-3" /> Store Name *</Label>
        <Input value={form.store_name} onChange={(e) => setForm(f => ({ ...f, store_name: e.target.value }))} placeholder="e.g. Juan's Tech Hub" className="text-sm" />
      </div>
      <div>
        <Label className="text-xs font-bold flex items-center gap-1 mb-1.5"><MessageSquare className="h-3 w-3" /> Store Saying</Label>
        <Input value={form.store_saying} onChange={(e) => setForm(f => ({ ...f, store_saying: e.target.value }))} placeholder="e.g. Your one-stop campus shop!" className="text-sm" />
      </div>
      <div>
        <Label className="text-xs font-bold flex items-center gap-1 mb-1.5"><Image className="h-3 w-3" /> Store Image</Label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file) uploadStoreImage(file);
        }} />
        {form.store_image ? (
          <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border">
            <img src={form.store_image} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setForm(f => ({ ...f, store_image: "" }))} className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
            <span className="text-[10px] text-muted-foreground">{uploading ? "Uploading..." : "Tap to upload store image"}</span>
          </button>
        )}
      </div>
      <div>
        <Label className="text-xs font-bold flex items-center gap-1 mb-1.5"><MapPin className="h-3 w-3" /> Location</Label>
        <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Main Building, 2nd Floor" className="text-sm" />
      </div>
      <div>
        <Label className="text-xs font-bold mb-1.5 block">Description</Label>
        <Textarea value={form.store_description} onChange={(e) => setForm(f => ({ ...f, store_description: e.target.value }))} placeholder="Describe your store..." className="text-sm" rows={3} />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Store"}
      </Button>
    </div>
  );
}

function SellerOrdersTab({ user }: { user: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "approved" | "completed">("all");
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    // Load seller's own products first
    (supabase as any).from("products").select("id, name").eq("seller_id", user.id)
      .then(({ data }: any) => {
        setProducts(data || []);
        const productIds = (data || []).map((p: any) => p.id);
        if (productIds.length === 0) { setOrders([]); return; }

        // Fetch orders that contain seller's products (seller_id on order)
        (supabase as any).from("orders").select("*")
          .eq("seller_id", user.id)
          .in("status", ["approved", "completed"])
          .order("created_at", { ascending: false })
          .limit(100)
          .then(({ data: orderData }: any) => setOrders(orderData || []));
      });
  }, [user]);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const totalSales = filtered.reduce((sum, o) => sum + Number(o.total), 0);
  const sellerEarnings = filtered.reduce((sum, o) => sum + Number(o.seller_earnings || 0), 0);
  const totalOrders = filtered.length;
  const completedOrders = filtered.filter(o => o.status === "completed").length;

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-primary/10 to-accent rounded-xl p-3 border border-primary/20 text-center">
          <p className="text-xl font-extrabold text-primary">₱{totalSales.toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground font-bold">Total Sales</p>
        </div>
        <div className="bg-gradient-to-br from-[hsl(var(--success))]/10 to-[hsl(var(--success))]/5 rounded-xl p-3 border border-[hsl(var(--success))]/20 text-center">
          <p className="text-xl font-extrabold text-[hsl(var(--success))]">₱{sellerEarnings.toFixed(2)}</p>
          <p className="text-[9px] text-muted-foreground font-bold">Your Earnings (80%)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card rounded-xl p-2.5 border border-border text-center">
          <p className="text-lg font-extrabold text-foreground">{totalOrders}</p>
          <p className="text-[9px] text-muted-foreground">Total Orders</p>
        </div>
        <div className="bg-card rounded-xl p-2.5 border border-border text-center">
          <p className="text-lg font-extrabold text-foreground">{completedOrders}</p>
          <p className="text-[9px] text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5">
        {(["all", "approved", "completed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border"
            }`}
          >
            {f === "all" ? "All" : f === "approved" ? "Approved" : "Completed"}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <p className="font-bold text-sm">Orders ({filtered.length})</p>
      {filtered.map(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        // Only show items that belong to this seller's products
        const myProductIds = products.map(p => p.id);
        const myItems = items.filter((item: any) => myProductIds.includes(item.id));
        const itemsTotal = myItems.reduce((s: number, i: any) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0);

        return (
          <div key={order.id} className="bg-card rounded-xl p-3 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                {order.customer_name && (
                  <span className="text-[10px] text-foreground font-bold ml-2">{order.customer_name}</span>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                order.status === 'completed' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-primary/20 text-primary'
              }`}>{order.status}</span>
            </div>
            {myItems.length > 0 ? myItems.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs text-muted-foreground">
                <span>{item.name} ×{item.quantity}</span>
                <span>₱{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</span>
              </div>
            )) : items.slice(0, 3).map((item: any, i: number) => (
              <p key={i} className="text-xs text-muted-foreground">{item.name} ×{item.quantity}</p>
            ))}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-[10px] text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <div className="text-right">
                <span className="font-bold text-sm text-primary">₱{Number(order.total).toFixed(2)}</span>
                <p className="text-[9px] text-[hsl(var(--success))] font-bold">Earned: ₱{Number(order.seller_earnings || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="text-center py-8">
          <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            {products.length === 0 ? "Add products first to start receiving orders" : "No orders yet for your products"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SellerStorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    (supabase as any).from("seller_profiles").select("id").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => {
        if (!data) { navigate("/club"); return; }
        setLoading(false);
      });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/club")} className="p-1"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-foreground">My Seller Store</h1>
              <p className="text-[10px] text-muted-foreground">Manage your store, products & orders</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="products" className="text-xs gap-1"><Package className="h-3 w-3" />Products</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1"><Store className="h-3 w-3" />Store</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="products"><SellerProductsTab user={user} /></TabsContent>
          <TabsContent value="settings"><StoreSettingsTab user={user} /></TabsContent>
          <TabsContent value="orders"><SellerOrdersTab user={user} /></TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}
