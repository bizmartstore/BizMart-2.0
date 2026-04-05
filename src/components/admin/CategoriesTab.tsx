import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, RefreshCw, Search, FolderOpen } from "lucide-react";
import { categories as fallbackCategories } from "@/data/products";

interface Category {
  id: string;
  name: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    icon: "",
    sort_order: 0,
  });

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("categories")
      .select("*")
      .order("sort_order");
    if (!error && data) setCategories(data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ name: "", icon: "", sort_order: 0 });
    setEditId(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    if (!form.icon.trim()) { toast.error("Category icon is required"); return; }
    
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        icon: form.icon.trim(),
        sort_order: form.sort_order,
        is_active: true,
      };

      if (editId) {
        const { error } = await (supabase as any).from("categories").update(payload).eq("id", editId);
        if (error) throw error;
        toast.success("Category updated!");
      } else {
        const id = `cat-${Date.now()}`;
        const { error } = await (supabase as any).from("categories").insert({ ...payload, id });
        if (error) throw error;
        toast.success("Category added!");
      }
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const edit = (cat: Category) => {
    setForm({
      name: cat.name,
      icon: cat.icon,
      sort_order: cat.sort_order,
    });
    setEditId(cat.id);
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category? Products in this category will not be deleted.")) return;
    try {
      const { error } = await (supabase as any).from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Category deleted");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await (supabase as any).from("categories").update({ is_active: !active }).eq("id", id);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle");
    }
  };

  const syncDefaults = async () => {
    if (!confirm(`Sync ${fallbackCategories.length} default categories?`)) return;
    let added = 0;
    try {
      for (const cat of fallbackCategories) {
        const { data: existing } = await (supabase as any).from("categories").select("id").eq("id", cat.id).maybeSingle();
        if (!existing) {
          const { error } = await (supabase as any).from("categories").insert({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            is_active: true,
            sort_order: 0,
          });
          if (!error) added++;
        }
      }
      toast.success(`Synced ${added} categories!`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Sync failed");
    }
  };

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..." className="pl-9 text-xs h-9" />
          </div>
          <Button size="sm" variant="outline" onClick={syncDefaults} className="gap-1"><RefreshCw className="h-3 w-3" /> Sync Defaults</Button>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }} className="gap-1 ml-2">
          <Plus className="h-3 w-3" />{showForm ? "Cancel" : "Add Category"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Category Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Notebooks" className="text-xs h-8" />
            </div>
            <div>
              <Label className="text-[10px]">Icon (Emoji) *</Label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="e.g. 📓" className="text-xs h-8" />
            </div>
          </div>
          <div>
            <Label className="text-[10px]">Sort Order</Label>
            <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="text-xs h-8" />
          </div>
          <Button onClick={save} disabled={saving} size="sm" className="w-full gap-1">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <FolderOpen className="h-3 w-3" />}
            {editId ? "Update" : "Add"} Category
          </Button>
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.map(cat => (
          <div key={cat.id} className="bg-card rounded-lg p-2 border border-border flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl flex-shrink-0">
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{cat.name}</p>
              <p className="text-[10px] text-muted-foreground">Sort: {cat.sort_order}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0 items-center">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cat.is_active ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}`}>
                {cat.is_active ? "ON" : "OFF"}
              </span>
              <button onClick={() => toggleActive(cat.id, cat.is_active)} className="p-1 text-muted-foreground hover:text-primary">
                {cat.is_active ? "👁️" : "👁️‍🗨️"}
              </button>
              <button onClick={() => edit(cat)} className="p-1 text-primary"><Edit2 className="h-3 w-3" /></button>
              <button onClick={() => remove(cat.id)} className="p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No categories found</p>}
      </div>
    </div>
  );
}