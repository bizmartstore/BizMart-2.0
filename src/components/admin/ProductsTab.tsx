import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Package, Upload, X, Search, RefreshCw } from "lucide-react";
import { products as fallbackProducts, categories as fallbackCategories } from "@/data/products";

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function ProductsTab() {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", price: 0, original_price: "", image: "", images: [] as string[], category: "",
    stock: 0, description: "", is_flash_sale: false,
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const additionalFileRef = useRef<HTMLInputElement>(null);

  const loadCategories = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("categories")
      .select("id, name, icon")
      .eq("is_active", true)
      .order("sort_order");
    if (!error && data) setCategories(data);
    else setCategories(fallbackCategories);
  }, []);

  const loadProducts = useCallback(() => {
    (supabase as any).from("products").select("*").order("created_at", { ascending: false })
      .then(({ data }: any) => setProducts(data || []));
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  const resetForm = () => setForm({
    name: "", price: 0, original_price: "", image: "", images: [], category: "",
    stock: 0, description: "", is_flash_sale: false,
  });

  const uploadImage = async (file: File, isAdditional = false) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("seller-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("seller-images").getPublicUrl(path);
      
      if (isAdditional) {
        setForm(f => ({ ...f, images: [...f.images, publicUrl].slice(0, 3) }));
        toast.success("Additional image added!");
      } else {
        setForm(f => ({ ...f, image: publicUrl }));
        toast.success("Main image uploaded!");
      }
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const removeImage = (index: number, isAdditional = false) => {
    if (isAdditional) {
      setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
    } else {
      setForm(f => ({ ...f, image: "" }));
    }
  };

  const forceRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['initial-data'], refetchType: 'all' });
    queryClient.refetchQueries({ queryKey: ['products'] });
    loadProducts();
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (form.price <= 0) { toast.error("Price must be greater than 0"); return; }
    if (!form.image) { toast.error("Please upload a main product image"); return; }
    if (!form.category) { toast.error("Please select a category"); return; }
    
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: form.price,
        original_price: form.original_price ? Number(form.original_price) : null,
        image: form.image.trim(),
        images: form.images.length > 0 ? form.images : null,
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
      
      forceRefreshAll();
      resetForm(); 
      setShowForm(false); 
      setEditId(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const edit = (p: any) => {
    setForm({
      name: p.name, price: Number(p.price),
      original_price: p.original_price || "", image: p.image || "",
      images: p.images || [],
      category: p.category || "", stock: p.stock || 0,
      description: p.description || "", is_flash_sale: p.is_flash_sale || false,
    });
    setEditId(p.id); setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await (supabase as any).from("products").delete().eq("id", id);
    forceRefreshAll();
    toast.success("Product deleted");
  };

  const toggleActive = async (id: string, active: boolean) => {
    await (supabase as any).from("products").update({ is_active: !active }).eq("id", id);
    forceRefreshAll();
  };

  const syncDefaults = async () => {
    if (!confirm(`Sync ${fallbackProducts.length} default products?`)) return;
    let addedCats = 0, addedProds = 0, errors = 0;
    try {
      for (const cat of fallbackCategories) {
        const { data: existing } = await (supabase as any).from("categories").select("id").eq("id", cat.id).maybeSingle();
        if (!existing) {
          const { error } = await (supabase as any).from("categories").insert({
            id: cat.id, name: cat.name, icon: cat.icon, is_active: true, sort_order: 0
          });
          if (!error) addedCats++;
        }
      }

      for (const p of fallbackProducts) {
        try {
          const { data: existing } = await (supabase as any).from("products").select("id").eq("id", p.id).maybeSingle();
          if (!existing) {
            const { error } = await (supabase as any).from("products").insert({
              id: p.id, name: p.name, price: p.price,
              original_price: p.originalPrice || null, image: p.image,
              images: p.images || null, category: p.category, stock: p.stock || 100,
              description: p.description, is_flash_sale: p.isFlashSale || false,
              is_active: true, rating: p.rating, sold: p.sold,
            });
            if (error) errors++; else addedProds++;
          }
        } catch { errors++; }
      }
      
      forceRefreshAll();
      toast.success(`Synced ${addedCats} categories and ${addedProds} products! ${errors > 0 ? `${errors} failed.` : ''}`);
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    }
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
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 text-xs h-9" />
          </div>
          <Button size="sm" variant="outline" onClick={syncDefaults} className="gap-1"><RefreshCw className="h-3 w-3" /> Sync Defaults</Button>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setEditId(null); setShowForm(!showForm); }} className="gap-1 ml-2">
          <Plus className="h-3 w-3" />{showForm ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px]">Product Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Notebook" className="text-xs h-8" /></div>
            <div>
              <Label className="text-[10px]">Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-[10px]">Price ₱ *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Orig Price</Label><Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} className="text-xs h-8" /></div>
            <div><Label className="text-[10px]">Stock *</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="text-xs h-8" /></div>
          </div>
          
          <div>
            <Label className="text-[10px]">Main Product Image *</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) uploadImage(file, false); }} />
            {form.image ? (
              <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border mt-1">
                <img src={form.image} alt="Main" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(0, false)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 z-10"><X className="h-3 w-3" /></button>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded">Main</div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 mt-1 hover:bg-muted/50 transition-colors">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground">{uploading ? "Uploading..." : "Tap to upload main image"}</span>
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[10px]">Additional Images (Carousel)</Label>
              <span className="text-[9px] text-muted-foreground">{form.images.length}/3</span>
            </div>
            <input ref={additionalFileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { const files = e.target.files; if (files) Array.from(files).forEach(file => { if (form.images.length < 3) uploadImage(file, true); }); }} />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-border group">
                  <img src={img} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(idx, true)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><X className="h-4 w-4 text-white" /></button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] py-0.5 text-center">{idx + 1}</div>
                </div>
              ))}
              {form.images.length < 3 && (
                <button onClick={() => additionalFileRef.current?.click()} disabled={uploading} className="w-16 h-16 flex-shrink-0 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-[8px] text-muted-foreground">Add</span>
                </button>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">Click to add up to 3 additional images for product carousel</p>
          </div>

          <div><Label className="text-[10px]">Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="text-xs" rows={2} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_flash_sale} onCheckedChange={(v) => setForm(f => ({ ...f, is_flash_sale: v }))} />
            <Label className="text-[10px]">Flash Sale Product</Label>
          </div>
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
              ₱{p.price} · Stock: <span className={`font-bold ${(p.stock || 0) <= 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`}>{p.stock || 0}</span>
              {p.images && p.images.length > 0 && <span className="ml-1 text-primary">· {p.images.length} extra</span>}
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
      {products.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No products yet. Add your first product!</p>}
    </div>
  );
}