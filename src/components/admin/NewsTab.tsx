import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check, Loader2, RefreshCw, Upload, Image as ImageIcon } from "lucide-react";

// Version 3.0 - No IDs, only data
const DEFAULT_NEWS_ITEMS = [
  {
    title: "BizMart Store v2.0 Coming June 2026",
    content: "We're thrilled to announce the official release of BizMart Store v2.0! This major update brings a redesigned interface, faster checkout, improved notifications, and many more features to enhance your shopping experience.",
    category: "updates",
  },
  {
    title: "Welcome New BizMart Staff Members!",
    content: "Please join us in welcoming our newest team members who will be helping run the BizMart Store. They bring fresh energy and great ideas to our campus marketplace!",
    category: "members",
  },
  {
    title: "New Academic Assistance Policy",
    content: "We have updated our guidelines for the Job Offers section. Freelancers are reminded to only provide guidance and tutoring. Doing assignments for others is strictly prohibited to maintain academic integrity.",
    category: "general",
  }
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
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("news_updates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error loading news:", error);
    } else if (data) {
      setNews(data.map((d: any) => ({ ...d, images: d.images || [] })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(""); setContent(""); setCategory("general");
    setImages([]); setEditId(null); setShowForm(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `news/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('news-images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(filePath);
      setImages(prev => [...prev, publicUrl]);
      toast.success("Image uploaded!");
    } catch (error: any) {
      toast.error("Upload failed. Ensure 'news-images' bucket exists.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content required");
      return;
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      image_url: images[0] || null,
      images: images,
      category,
      is_active: true,
    };

    try {
      if (editId) {
        const { error } = await (supabase as any).from("news_updates").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editId);
        if (error) throw error;
        toast.success("Updated!");
      } else {
        const { error } = await (supabase as any).from("news_updates").insert(payload);
        if (error) throw error;
        toast.success("Published!");
      }
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const syncDefaults = async () => {
    console.log("[NewsTab] Starting Sync Version 3.0...");
    setSyncing(true);
    let added = 0;
    try {
      for (const item of DEFAULT_NEWS_ITEMS) {
        // Check by title ONLY. No IDs used here.
        const { data: existing } = await (supabase as any)
          .from("news_updates")
          .select("id")
          .eq("title", item.title)
          .maybeSingle();

        if (!existing) {
          const { error } = await (supabase as any)
            .from("news_updates")
            .insert({
              title: item.title,
              content: item.content,
              category: item.category,
              is_active: true,
              images: []
            });
          if (!error) added++;
        }
      }
      toast.success(`Synced ${added} items!`);
      load();
    } catch (err: any) {
      console.error("[NewsTab] Sync Error:", err);
      toast.error("Sync failed. Check console.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await (supabase as any).from("news_updates").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from("news_updates").update({ is_active: !current }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">News & Updates</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={syncDefaults} disabled={syncing} className="text-xs h-8">
            {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            Sync Defaults
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }} className="text-xs h-8">
            {showForm ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            {showForm ? "Cancel" : "Add News"}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline" className="text-sm" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="members">Members</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="updates">Updates</SelectItem>
            </SelectContent>
          </Select>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" className="text-sm min-h-[100px]" />
          
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                <img src={url} className="w-full h-full object-cover" />
                <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-destructive text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </div>
            ))}
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-16 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
          <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />

          <Button onClick={handleSave} className="w-full font-bold">Publish Post</Button>
        </div>
      )}

      <div className="space-y-2">
        {news.map((item) => (
          <div key={item.id} className="bg-card rounded-xl border border-border p-3 flex gap-3">
            {item.image_url && <img src={item.image_url} className="h-12 w-12 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-xs font-bold truncate">{item.title}</h4>
                <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item.id, item.is_active)} className="scale-75" />
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{item.content}</p>
              <div className="flex gap-2 mt-1">
                <button onClick={() => { setEditId(item.id); setTitle(item.title); setContent(item.content); setCategory(item.category); setImages(item.images); setShowForm(true); }} className="text-[10px] text-primary font-bold">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-[10px] text-destructive font-bold">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}