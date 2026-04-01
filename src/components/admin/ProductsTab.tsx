import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Package, Upload, X, Search, RefreshCw } from "lucide-react";
import { products as fallbackProducts } from "@/data/products";

export default function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    price: 0,
    original_price: "",
    image: "",
    category: "",
    stock: 0,
    description: "",
    is_flash_sale: false,
  });
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

  const syncDefaults = async () => {
    if (!confirm(`Sync ${fallbackProducts.length} default products?`)) return;
    let added = 0;
    for (const p of fallbackProducts) {
      const { data: existing } = await (supabase as any).from("products").select("id").eq("id", p.id).maybeSingle();
      if (!existing) {
        await (supabase as any).from("products").insert({
          id: p.id, name: p.name, price: p.price,
          original_price: p.originalPrice || null, image: p.image,
          category: p.category, stock: p.stock || 100,
          description: p.description, is_flash_sale: p.isFlashSale || false,
          is_active: true, rating: p.rating, sold: p.sold,
        });
        added++;
      }
    }
    toast.success(`Synced ${added} new products!`);
    load();
  };

  const filtered = products.filter(p => 
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 text-sm h-9" />
          </div>
          <Button size="sm" variant="outline" onClick={syncDefaults} className="gap-1"><RefreshCw className="h-3 w-3" /></Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs">{editId ? "Edit" : "New"} Product</span>
            <button onClick={resetForm} className="text-[10px] hover:text-primary">✕</button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px]">Product Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Notebook" className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. notebooks" className="text-xs h-8" /></div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-[10px]">Price ₱ *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Orig Price</Label><Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Stock *</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="text-xs h-8" /></div>
          </div>
          
          <div>
            <Label className="text-[10px]">Image</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file); }} />
            {form.image ? (
              <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border mt-1">
                <img src={form.image} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setForm(f => ({ ...f, image: "" }))} className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1"> <X className="h-3 w-3" /> </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground">{uploading ? "Uploading..." : "Tap to upload"}</span>
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

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.map(p => (
          <div key={p.id} className="bg-card rounded-lg p-2 border border-border flex items-center gap-2">
            {p.image && <img src={p.image} className="h-10 w-10 rounded object-cover flex-shrink-0" alt="" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">
                ₱{p.price} · Stock: <span className={p.stock <= 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}">{p.stock || 0}</span>
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0 items-center">
              <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
              <button onClick={() => edit(p)} className="p-1 text-primary"><Edit2 className="h-3 w-3" /></button>
              <button onClick={() => remove(p.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-6">No products found</p>}
      </div>
    </div>
  );
}