import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Package, Upload, X } from "lucide-react";

export default function SellerProductsTab({ user }: { user: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", price: 0, original_price: "", image: "", category: "",
    stock: 0, description: "", isFlashSale: false,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    (supabase as any).from("products").select("*").eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setProducts(data || []));
  };
  useEffect(load, [user]);

  const resetForm = () => setForm({
    name: "", price: 0, original_price: "", image: "", category: "",
    stock: 0, description: "", isFlashSale: false,
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `products/${user.id}/${Date.now()}.${ext}`;
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
        isflashsale: form.isFlashSale, // Using isflashsale
        seller_id: user.id,
        is_active: true,
        rating: 4.5,
        sold: 0,
      };

      if (editId) {
        const { error } = await (supabase as any).from("products").update(payload).eq("id", editId);
        if (error) throw error;
        toast.success("Product updated!");
      } else {
        const { error } = await (supabase as any).from("products").insert({ ...payload, id: crypto.randomUUID() });
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
      description: p.description || "", 
      isFlashSale: !!p.isflashsale, // Map from isflashsale
    });
    setEditId(p.id); setShowForm(true);
  };

  const remove = async (id: string) => {
    await (supabase as any).from("products").delete().eq("id", id);
    load(); toast.success("Product deleted");
  };

  const toggleActive = async (id: string, active: boolean) => {
    await (supabase as any).from("products").update({ is_active: !active }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-3">
      <Button onClick={() => { resetForm(); setEditId(null); setShowForm(!showForm); }} size="sm" className="gap-1">
        <Plus className="h-3 w-3" />{showForm ? "Cancel" : "Add Product"}
      </Button>

      {showForm && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div>
            <Label className="text-[10px]">Product Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Handmade Bracelet" className="text-xs h-8" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-[10px]">Price ₱ *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Orig Price</Label><Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Stock *</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="text-xs h-8" /></div>
          </div>
          <div><Label className="text-[10px]">Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. accessories" className="text-xs h-8" /></div>
          
          <div>
            <Label className="text-[10px]">Product Image</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file);
            }} />
            {form.image ? (
              <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border mt-1">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setForm(f => ({ ...f, image: "" }))} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 mt-1 hover:bg-muted/50 transition-colors">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground">Tap to upload image</span>
              </button>
            )}
          </div>

          <div><Label className="text-[10px]">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-xs" rows={2} /></div>
          <Button onClick={save} disabled={saving} size="sm" className="w-full gap-1">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
            {editId ? "Update" : "Add"} Product
          </Button>
        </div>
      )}

      <p className="font-bold text-sm">My Products ({products.length})</p>
      {products.map(p => (
        <div key={p.id} className="bg-card rounded-lg p-2 border border-border flex items-center gap-2">
          {p.image && <img src={p.image} className="h-10 w-10 rounded object-cover flex-shrink-0" alt="" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{p.name}</p>
            <p className="text-[10px] text-muted-foreground">
              ₱{p.price} · Stock: {p.stock || 0}
              {p.isflashsale && <span className="ml-2 text-orange-500 font-bold">⚡ FLASH</span>}
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0 items-center">
            <button onClick={() => toggleActive(p.id, p.is_active)} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${p.is_active ? 'bg-success/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}`}>
              {p.is_active ? "ON" : "OFF"}
            </button>
            <button onClick={() => edit(p)} className="p-1 text-primary"><Edit2 className="h-3 w-3" /></button>
            <button onClick={() => remove(p.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}