import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check, ImagePlus, Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface BannerItem {
  id: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function BannerTab() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("*")
        .order("sort_order");
      
      if (error) throw error;
      if (data) setBanners(data);
    } catch (e: any) {
      console.error("Load error:", e);
      toast.error("Failed to load banners: " + e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setImageUrl("");
    setSortOrder(0);
    setEditId(null);
    setShowForm(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please refresh the page or log in again.");
        return;
      }

      const file = files[0];
      const ext = file.name.split(".").pop();
      const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      
      const { error } = await supabase.storage.from("banner-images").upload(path, file);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from("banner-images").getPublicUrl(path);
      setImageUrl(publicUrl);
      toast.success("Banner image uploaded!");
    } catch (e: any) {
      console.error("Upload process failed:", e);
      toast.error("Upload process failed: " + (e.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!imageUrl.trim()) { 
      toast.error("Image URL is required"); 
      return; 
    }
    if (sortOrder < 0) { 
      toast.error("Sort order must be a non-negative number"); 
      return; 
    }
    
    setSaving(true);
    
    // Safety timeout to guarantee UI never gets stuck
    const safetyTimer = setTimeout(() => {
      console.warn("[BannerTab] Save operation timed out, forcing UI reset");
      setSaving(false);
      toast.error("Operation took too long. Please try again.");
    }, 6000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please refresh and log in again.");
        return;
      }

      const payload = {
        image_url: imageUrl.trim(),
        sort_order: sortOrder,
        is_active: true,
      };

      console.log("[BannerTab] Saving payload:", payload);

      // Remove .select() to reduce overhead and potential lock issues
      const baseQuery = editId
        ? (supabase as any).from("banners").update(payload).eq("id", editId)
        : (supabase as any).from("banners").insert(payload);

      // Add a small delay to ensure any previous transactions complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const { error } = await baseQuery;
      
      if (error) {
        console.error("[BannerTab] DB Error:", error);
        throw error;
      }
      
      console.log("[BannerTab] Save successful");
      toast.success(editId ? "Banner updated!" : "Banner published!");
      resetForm();
      load();
    } catch (e: any) {
      console.error("Save error:", e);
      toast.error("Failed to save: " + (e.message || "Unknown error"));
    } finally {
      clearTimeout(safetyTimer);
      setSaving(false);
    }
  };

  const handleEdit = (item: BannerItem) => {
    setEditId(item.id);
    setImageUrl(item.image_url);
    setSortOrder(item.sort_order);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      const { error } = await (supabase as any).from("banners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted!");
      load();
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await (supabase as any).from("banners").update({ is_active: active }).eq("id", id);
      if (error) throw error;
      load();
    } catch (e: any) {
      toast.error("Update failed: " + e.message);
    }
  };

  const syncDefaults = async () => {
    setSyncing(true);
    try {
      // Sync default banners from assets
      const defaultBanners = [
        { url: "/src/assets/banner1.jpg", order: 0 },
        { url: "/src/assets/banner2.jpg", order: 1 }
      ];
      
      for (const banner of defaultBanners) {
        const { data: existing } = await (supabase as any)
          .from("banners")
          .select("id")
          .eq("image_url", banner.url)
          .maybeSingle();
        
        if (!existing) {
          const { error } = await (supabase as any).from("banners").insert({
            image_url: banner.url,
            sort_order: banner.order,
            is_active: true,
          });
          if (error) throw error;
        }
      }
      
      toast.success("Default banners synced!");
      load();
    } catch (e: any) {
      console.error("Sync error:", e);
      toast.error("Sync failed: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Banners</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={syncDefaults} disabled={syncing} className="text-xs h-8 gap-1">
            {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Sync Defaults
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="text-xs h-8">
            <Plus className="h-3 w-3 mr-1" /> Add Banner
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs">{editId ? "Edit" : "New"} Banner</span>
            <button onClick={resetForm}><X className="h-4 w-4" /></button>
          </div>
          <div>
            <Label className="text-xs">Image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="text-xs" placeholder="Banner image URL..." />
          </div>
          <div>
            <Label className="text-xs">Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="text-xs" placeholder="0 for first, 1 for second, etc." />
          </div>
          <div>
            <Label className="text-xs">Image</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <div className="flex flex-wrap gap-2 mt-1.5">
              {imageUrl && (
                <div key="preview" className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                  <img src={imageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageUrl("")}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-[8px] mt-0.5">{uploading ? "..." : "Add"}</span>
              </button>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full text-xs" disabled={uploading || saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
            {editId ? "Update" : "Publish"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {banners.map((item) => {
          return (
            <div key={item.id} className="bg-card rounded-xl border border-border p-3 flex gap-3">
              {item.image_url && (
                <div className="flex gap-1 flex-shrink-0">
                  <img src={item.image_url} alt="Banner" className="w-24 h-24 rounded-lg object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Banner #{item.id.slice(0, 6)}</h4>
                    <p className="text-[10px] text-muted-foreground">Sort Order: {item.sort_order}</p>
                  </div>
                  <Switch checked={item.is_active} onCheckedChange={(v) => toggleActive(item.id, v)} />
                </div>
                <div className="flex gap-2 mt-1.5">
                  <button onClick={() => handleEdit(item)} className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-[10px] text-destructive font-bold flex items-center gap-0.5">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {banners.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No banners yet. Click "Sync Defaults" to load sample banners.</p>
          </div>
        )}
      </div>
    </div>
  );
}