import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Image as ImageIcon, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

export default function BannersTab() {
  const [banners, setBanners] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      setBanners(data || []);
    } catch (e: any) {
      console.error("Failed to load banners:", e);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBanners(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `banners/${Date.now()}.${ext}`;
      
      // Try 'banners' bucket first, fallback to 'seller-images' if it doesn't exist
      let bucketName = "banners";
      let { error: uploadError } = await supabase.storage.from(bucketName).upload(path, file);
      if (uploadError?.message?.includes("not found")) {
        bucketName = "seller-images";
        ({ error: uploadError } = await supabase.storage.from(bucketName).upload(path, file));
      }
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(path);
      
      const maxSort = banners.length > 0 ? Math.max(...banners.map((b: any) => b.sort_order || 0)) : 0;
      const { error: dbError } = await (supabase as any).from("banners").insert({
        image_url: publicUrl,
        is_active: true,
        sort_order: maxSort + 1,
      });
      if (dbError) throw dbError;
      
      toast.success("Banner added successfully!");
      loadBanners();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await (supabase as any).from("banners").update({ is_active: !active }).eq("id", id);
      loadBanners();
    } catch (e: any) {
      toast.error("Failed to update banner");
    }
  };

  const deleteBanner = async (id: string, url: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      // Extract path from URL to delete from storage
      const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
      if (match) {
        const bucket = url.includes("/banners/") ? "banners" : "seller-images";
        await supabase.storage.from(bucket).remove([match[1]]);
      }
      await (supabase as any).from("banners").delete().eq("id", id);
      toast.success("Banner deleted");
      loadBanners();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const moveBanner = async (id: string, direction: "up" | "down") => {
    const idx = banners.findIndex((b: any) => b.id === id);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === banners.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = banners[idx];
    const swap = banners[swapIdx];

    try {
      await (supabase as any).from("banners").update({ sort_order: swap.sort_order ?? swapIdx }).eq("id", current.id);
      await (supabase as any).from("banners").update({ sort_order: current.sort_order ?? idx }).eq("id", swap.id);
      loadBanners();
    } catch (e: any) {
      toast.error("Failed to reorder");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">Homepage Banners</h3>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add Banner
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {banners.map((banner: any, idx: number) => (
            <div key={banner.id} className="bg-card rounded-xl border border-border overflow-hidden group">
              <div className="relative aspect-[2/1] bg-muted">
                <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
                {!banner.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-xs bg-black/30 px-2 py-1 rounded">INACTIVE</span>
                  </div>
                )}
              </div>
              <div className="p-2 flex items-center justify-between bg-card">
                <div className="flex items-center gap-1">
                  <button onClick={() => moveBanner(banner.id, "up")} disabled={idx === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveBanner(banner.id, "down")} disabled={idx === banners.length - 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(banner.id, banner.is_active)} className="p-1.5 rounded hover:bg-muted transition-colors" title={banner.is_active ? "Hide" : "Show"}>
                    {banner.is_active ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => deleteBanner(banner.id, banner.image_url)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="col-span-full text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No banners yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Banner" to upload your first homepage banner.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}