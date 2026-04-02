import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check, ImagePlus, Loader2, RefreshCw, AlertCircle } from "lucide-react";

const DEFAULT_NEWS = [
  {
    title: "BizMart Store v2.0 Coming June 2026",
    content: "We're thrilled to announce the official release of BizMart Store v2.0! This major update brings a redesigned interface, faster checkout, improved notifications, and many more features to enhance your shopping experience.",
    image_url: null,
    images: [],
    category: "updates",
    is_active: true,
  },
  {
    title: "Welcome New BizMart Staff Members!",
    content: "Please join us in welcoming our newest team members who will be helping run the BizMart Store. They bring fresh energy and great ideas to our campus marketplace!",
    image_url: null,
    images: [],
    category: "members",
    is_active: true,
  },
];

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  images: string[];
  category: string;
  is_active: boolean;
  created_at: string;
}

export default function NewsTab() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("news_updates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      if (data) setNews(data.map((d: any) => ({ ...d, images: d.images || [] })));
    } catch (e: any) {
      console.error("Load error:", e);
      toast.error("Failed to load news: " + e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(""); setContent(""); setCategory("general");
    setImages([]); setEditId(null); setShowForm(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("news-images")
          .upload(path, file);
        
        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Upload failed for ${file.name}: ${uploadError.message}`);
          continue;
        }
        
        const { data: urlData } = supabase.storage.from("news-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      setImages(prev => [...prev, ...newUrls]);
      if (newUrls.length > 0) toast.success(`Uploaded ${newUrls.length} image(s)`);
    } catch (e: any) {
      toast.error("Upload process failed: " + e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { 
      toast.error("Title and content are required"); 
      return; 
    }
    
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        image_url: images[0] || null,
        images,
        category,
      };

      if (editId) {
        const { error } = await (supabase as any)
          .from("news_updates")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editId);
        if (error) throw error;
        toast.success("News updated!");
      } else {
        const { error } = await (supabase as any)
          .from("news_updates")
          .insert(payload);
        if (error) throw error;
        toast.success("News published!");
      }
      resetForm();
      load();
    } catch (e: any) {
      console.error("Save error:", e);
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setImages(item.images?.length ? item.images : item.image_url ? [item.image_url] : []);
    setCategory(item.category);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this news item?")) return;
    try {
      const { error } = await (supabase as any).from("news_updates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted!");
      load();
    } catch (e: any) {
      toast.error("Delete failed: " + e.message);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await (supabase as any).from("news_updates").update({ is_active: active }).eq("id", id);
      if (error) throw error;
      load();
    } catch (e: any) {
      toast.error("Update failed: " + e.message);
    }
  };

  const syncDefaults = async () => {
    setSyncing(true);
    let added = 0;
    try {
      for (const item of DEFAULT_NEWS) {
        const { data: existing, error: checkError } = await (supabase as any)
          .from("news_updates")
          .select("id")
          .eq("title", item.title)
          .maybeSingle();
        
        if (checkError) throw checkError;

        if (!existing) {
          const { error: insertError } = await (supabase as any).from("news_updates").insert(item);
          if (insertError) throw insertError;
          added++;
        }
      }
      toast.success(`Synced ${added} default news items!`);
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
        <h3 className="font-bold text-sm">News & Updates</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={syncDefaults} disabled={syncing} className="text-xs h-8 gap-1">
            {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Sync Defaults
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="text-xs h-8">
            <Plus className="h-3 w-3 mr-1" /> Add News
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs">{editId ? "Edit" : "New"} News</span>
            <button onClick={resetForm}><X className="h-4 w-4" /></button>
          </div>
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xs" placeholder="News headline..." />
          </div>
          <div>
            <Label className="text-xs">Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="text-xs" rows={4} placeholder="Full news content..." />
          </div>

          <div>
            <Label className="text-xs">Images</Label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
            <div className="flex flex-wrap gap-2 mt-1.5">
              {images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-[8px] mt-0.5">{uploading ? "..." : "Add"}</span>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="members">Members & Staff</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="updates">App Updates</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full text-xs" disabled={uploading || saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
            {editId ? "Update" : "Publish"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {news.map((item) => {
          const allImages = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];
          return (
            <div key={item.id} className="bg-card rounded-xl border border-border p-3 flex gap-3">
              {allImages.length > 0 && (
                <div className="flex gap-1 flex-shrink-0">
                  {allImages.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ))}
                  {allImages.length > 3 && (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                      +{allImages.length - 3}
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-primary">{item.category}</span>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{item.content}</p>
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
        {news.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No news yet. Click "Sync Defaults" to load sample news.</p>
          </div>
        )}
      </div>
    </div>
  );
}