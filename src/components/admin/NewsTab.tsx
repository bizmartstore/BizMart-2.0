import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check, ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await (supabase as any)
      .from("news_updates")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setNews(data.map((d: any) => ({ ...d, images: d.images || [] })));
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("general");
    setImages([]);
    setEditId(null);
    setShowForm(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("news-images").upload(path, file);
      if (error) { toast.error(`Upload failed: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("news-images").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }
    setImages(prev => [...prev, ...newUrls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content required"); return; }
    const payload = {
      title: title.trim(),
      content: content.trim(),
      image_url: images[0] || null,
      images,
      category,
    };

    if (editId) {
      await (supabase as any).from("news_updates").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editId);
      toast.success("News updated!");
    } else {
      await (supabase as any).from("news_updates").insert(payload);
      toast.success("News published!");
    }
    resetForm();
    load();
  };

  const handleEdit = (item: NewsItem) => {
    setEditId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setImages(item.images?.length ? item.images : (item.image_url ? [item.image_url] : []));
    setCategory(item.category);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this news item?")) return;
    await (supabase as any).from("news_updates").delete().eq("id", id);
    toast.success("Deleted!");
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await (supabase as any).from("news_updates").update({ is_active: active }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">News & Updates</h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="text-xs h-8">Add News</Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs">{editId ? "Edit" : "New"} News</span>
            <button onClick={resetForm} className="text-[10px] hover:text-primary">Cancel</button>
          </div>
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="text-sm" placeholder="News headline..." />
          </div>
          <div>
            <Label className="text-xs">Content</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} className="text-sm" rows={4} placeholder="Full news content..." />
          </div>

          {/* Multi-image upload */}
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
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="members">Members & Staff</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="updates">App Updates</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full text-sm" disabled={uploading}>
            {uploading ? "Publishing..." : (editId ? "Update" : "Publish")}
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
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <Switch checked={item.is_active} onCheckedChange={(v) => toggleActive(item.id, v)} />
                  </div>
                </div>
                <div className="flex gap-2 mt-1.5">
                  <button onClick={() => handleEdit(item)} className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-[10px] text-destructive font-bold flex items-center gap-0.5">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        ))}
        {news.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No news yet. Add your first update!</p>} 
      </div>
    </div>
  );
}
</dyad-write<think>>

Now continue with next file.
</think><dyad-write path="src/components/admin/ClubTab.tsx" description="Fixing TypeScript errors in ClubTab.tsx">
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Crown, RefreshCw, Star } from "lucide-react";

export default function ClubTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("club_memberships").select("*, profiles(first_name, last_name, email, school, grade_level, section)").order("created_at", { ascending: false });
    setMembers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateMembership = async (id: string, status: string) => {
    await (supabase as any).from("club_memberships").update({ status }).eq("id", id);
    toast.success(`Membership ${status}`);
    load();
  };

  const filtered = members.filter(m => 
    !search || 
    (m.profiles?.first_name || "").toLowerCase().includes(search.toLowerCase()) || 
    m.profiles?.email.toLowerCase().includes(search.toLowerCase()) || 
    m.control_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-9 text-xs h-9" />
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="h-3 w-3" /></Button>
      </div>

      <div className="space-y-3">
        {filtered.map(m => (
          <div key={m.id} className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent overflow-hidden flex items-center justify-center">
                  <img src={m.store_image} alt={m.store_name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-xs">{m.store_name || "Unnamed Store"}</p>
                  <p className="text-[10px] text-muted-foreground">{m.profiles?.first_name} {m.profiles?.last_name}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.is_active ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}`}>{m.status}</span>
            </div>
            {m.store_saying && <p className="text-[10px] text-primary italic mb-2">"{m.store_saying}"</p>}
            {m.location && <p className="text-[10px] text-muted-foreground mb-2">📍 {m.location}</p>}
            <div className="flex gap-2">
              <Button size="sm" variant={m.is_active ? "destructive" : "default"} onClick={() => updateMembership(m.id, m.is_active ? "inactive" : "active")} className="flex-1 text-[10px]">
                {m.is_active ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}