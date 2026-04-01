import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check, ImagePlus, Loader2, RefreshCw, Upload, Image as ImageIcon } from "lucide-react";

// Default news items to sync (similar to fallbackProducts)
const DEFAULT_NEWS_DATA = [
  {
    title: "BizMart Store v2.0 Coming June 2026",
    content: "We're thrilled to announce the official release of BizMart Store v2.0! This major update brings a redesigned interface, faster checkout, improved notifications, and many more features to enhance your shopping experience.",
    category: "updates",
    is_active: true,
  },
  {
    title: "Welcome New BizMart Staff Members!",
    content: "Please join us in welcoming our newest team members who will be helping run the BizMart Store. They bring fresh energy and great ideas to our campus marketplace!",
    category: "members",
    is_active: true,
  },
  {
    title: "New Academic Assistance Policy",
    content: "We have updated our guidelines for the Job Offers section. Freelancers are reminded to only provide guidance and tutoring. Doing assignments for others is strictly prohibited to maintain academic integrity.",
    category: "general",
    is_active: true,
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
      toast.error("Failed to load news feed");
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

      const { error: uploadError } = await supabase.storage
        .from('news-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('news-images')
        .getPublicUrl(filePath);

      setImages(prev => [...prev, publicUrl]);
      toast.success("Image uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Upload failed. Make sure the 'news-images' bucket exists.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both a title and content.");
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
        const { error } = await (supabase as any)
          .from("news_updates")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editId);
        
        if (error) throw error;
        toast.success("News item updated!");
      } else {
        const { error } = await (supabase as any)
          .from("news_updates")
          .insert(payload);
        
        if (error) throw error;
        toast.success("News item published!");
      }
      resetForm();
      load();
    } catch (error: any) {
      toast.error(error.message || "Failed to save news item.");
    }
  };

  const syncDefaults = async () => {
    setSyncing(true);
    let addedCount = 0;
    try {
      for (const item of DEFAULT_NEWS_DATA) {
        // Check if news with this title already exists
        const { data: existing } = await (supabase as any)
          .from("news_updates")
          .select("id")
          .eq("title", item.title)
          .maybeSingle();

        if (!existing) {
          const { error } = await (supabase as any)
            .from("news_updates")
            .insert({
              ...item,
              images: [] // Start with empty images for defaults
            });
          
          if (!error) addedCount++;
        }
      }
      
      if (addedCount > 0) {
        toast.success(`Successfully synced ${addedCount} default news items!`);
        load();
      } else {
        toast.info("All default news items are already synced.");
      }
    } catch (err: any) {
      toast.error("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setImages(item.images || []);
    setCategory(item.category);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this news item?")) return;
    
    try {
      const { error } = await (supabase as any)
        .from("news_updates")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("News item deleted.");
      load();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete.");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from("news_updates")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      load();
    } catch (error: any) {
      toast.error("Failed to update status.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">News & Updates</h3>
          <p className="text-[10px] text-muted-foreground">Manage campus announcements and news</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={syncDefaults} 
            disabled={syncing} 
            className="text-xs h-8 gap-1.5"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync Defaults
          </Button>
          <Button 
            size="sm" 
            onClick={() => { resetForm(); setShowForm(!showForm); }} 
            className="text-xs h-8 gap-1.5"
          >
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? "Cancel" : "Add News"}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="font-bold text-sm flex items-center gap-2">
              {editId ? <Edit2 className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editId ? "Edit News Item" : "Create New Post"}
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold mb-1.5 block">Headline / Title</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="text-sm h-10 rounded-xl" 
                placeholder="Enter a catchy headline..." 
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-sm h-10 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General News</SelectItem>
                  <SelectItem value="members">Members & Staff</SelectItem>
                  <SelectItem value="events">Campus Events</SelectItem>
                  <SelectItem value="updates">App Updates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Content</Label>
              <Textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="text-sm rounded-xl min-h-[120px]" 
                placeholder="Write the full story here..." 
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Images</Label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {images.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Upload</span>
                    </>
                  )}
                </button>
              </div>
              <input 
                type="file" 
                ref={fileRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleUpload} 
              />
              <p className="text-[9px] text-muted-foreground italic">Tip: The first image will be used as the cover photo.</p>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full h-11 rounded-xl font-bold gap-2">
            <Check className="h-4 w-4" />
            {editId ? "Update News Item" : "Publish to Feed"}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading news feed...</p>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border">
            <ImageIcon className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No news items found</p>
            <Button variant="link" onClick={syncDefaults} className="text-xs text-primary">Sync default news</Button>
          </div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
              <div className="flex p-3 gap-3">
                {item.image_url ? (
                  <img src={item.image_url} className="h-16 w-16 rounded-xl object-cover flex-shrink-0 border border-border" alt="" />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary inline-block mb-1">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-foreground truncate">{item.title}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{item.content}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Switch 
                        checked={item.is_active} 
                        onCheckedChange={() => toggleActive(item.id, item.is_active)} 
                        className="scale-75 origin-right"
                      />
                      <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex border-t border-border divide-x divide-border">
                <button 
                  onClick={() => handleEdit(item)} 
                  className="flex-1 py-2 text-[10px] font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="h-3 w-3" /> Edit Post
                </button>
                <button 
                  onClick={() => handleDelete(item.id)} 
                  className="flex-1 py-2 text-[10px] font-bold text-destructive hover:bg-destructive/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}