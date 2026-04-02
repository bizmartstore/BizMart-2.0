import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Store, ArrowLeft, Save, Image, MapPin, MessageSquare, Loader2, Package, TrendingUp, X } from "lucide-react";

export default function StoreSettingsTab({ user }: { user: any }) {
  const [form, setForm] = useState({
    store_name: "",
    store_description: "",
    store_image: "",
    store_saying: "",
    location: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("seller_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => {
        if (data) setForm({
          store_name: data.store_name || "",
          store_description: data.store_description || "",
          store_image: data.store_image || "",
          store_saying: data.store_saying || "",
          location: data.location || "",
        });
      });
  }, [user]);

  const uploadStoreImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `stores/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("seller-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("seller-images").getPublicUrl(path);
      setForm(f => ({ ...f, store_image: publicUrl }));
      toast.success("Store image uploaded!");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.store_name.trim()) { toast.error("Store name is required."); return; }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("seller_profiles").update({
        store_name: form.store_name.trim(),
        store_description: form.store_description.trim(),
        store_image: form.store_image.trim(),
        store_saying: form.store_saying.trim(),
        location: form.location.trim(),
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Store updated! 🎉");
    } catch (e: any) {
      toast.error(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-br from-primary/20 to-accent relative overflow-hidden">
          {form.store_image ? <img src={form.store_image} alt="Store" className="w-full h-full object-cover" /> : (
            <div className="flex items-center justify-center h-full"><Image className="h-8 w-8 text-muted-foreground" /></div>
          </div>
          <div className="p-4">
            <h2 className="font-extrabold text-base text-foreground">{form.store_name || "Your Store Name"}</h2>
            {form.store_saying && <p className="text-xs text-primary italic mt-0.5">"{form.store_saying}"</p>}
            {form.location && <div className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">{form.location}</span></div>}
            {form.store_description && <p className="text-xs text-muted-foreground mt-2">{form.store_description}</p>}
          </div>
        </div>
      </div>

      {/* Fields */}
      <div>
        <Label className="text-xs font-bold flex items-center gap-1 mb-1.5"><Store className="h-3 w-3" /> Store Name *</Label>
        <Input value={form.store_name} onChange={(e) => setForm(f => ({ ...f, store_name: e.target.value }))} placeholder="e.g. Juan's Tech Hub" className="text-sm" />
      </div>
      <div>
        <Label className="text-xs font-bold flex items-center gap-1 mb-1.5"><MessageSquare className="h-3 w-3" /> Store Saying</Label>
        <Input value={form.store_saying} onChange={(e) => setForm(f => ({ ...f, store_saying: e.target.value }))} placeholder="e.g. Your one‑stop campus shop!" className="text-sm" />
      </div>
      <div>
        <Label className="text-xs font-bold flex items-center gap-1 mb-1.5"><Image className="h-3 w-3" /> Store Image</Label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file) uploadStoreImage(file);
        }} />
        {form.store_image ? (
          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border mt-1">
            <img src={form.store_image} alt="Store" className="w-full h-full object-cover" />
            <button onClick={() => setForm(f => ({ ...f, store_image: "" }))} className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
            <span className="text-[10px] text-muted-foreground">{uploading ? "Uploading..." : "Tap to upload store image"}</span>
          </button>
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Store"}
      </Button>
    </div>
  );
}