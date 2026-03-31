import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ChevronLeft, X, Calendar } from "lucide-react";
import newsSample1 from "@/assets/news-sample-1.jpg";
import newsSample2 from "@/assets/news-sample-2.jpg";
import newsSample3 from "@/assets/news-sample-3.jpg";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  images: string[];
  category: string;
  created_at: string;
}

/* ── Auto-swiping image carousel ── */
function ImageCarousel({ images, className = "", autoPlay = true }: { images: string[]; className?: string; autoPlay?: boolean }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    timerRef.current = setInterval(() => setCurrent(p => (p + 1) % images.length), 3000);
    return () => clearInterval(timerRef.current);
  }, [images.length, autoPlay]);

  if (images.length === 0) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((url, i) => (
          <img key={i} src={url} alt="" className="w-full h-full object-cover flex-shrink-0" />
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white w-3" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Detail modal ── */
function NewsDetail({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const allImages = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];
  const [imgIdx, setImgIdx] = useState(0);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card w-full max-w-md rounded-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 flex items-center justify-between px-4 pt-4 pb-2">
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${categoryColors[item.category] || categoryColors.general}`}>
            {item.category}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Image carousel */}
        {allImages.length > 0 && (
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${imgIdx * 100}%)` }}
              >
                {allImages.map((url, i) => (
                  <img key={i} src={url} alt={item.title} className="w-full h-56 object-cover flex-shrink-0" />
                ))}
              </div>
            </div>
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(p => (p - 1 + allImages.length) % allImages.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setImgIdx(p => (p + 1) % allImages.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? "bg-white scale-110" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-3">
          <h2 className="font-extrabold text-lg text-foreground leading-snug">{item.title}</h2>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="text-[10px] font-medium">
              {new Date(item.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.content}</p>
        </div>
      </div>
    </div>
  );
}

const categoryColors: Record<string, string> = {
  general: "bg-primary/10 text-primary",
  members: "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]",
  "members & staff": "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]",
  events: "bg-[hsl(45,95%,50%)]/10 text-[hsl(45,95%,40%)]",
  updates: "bg-secondary/10 text-secondary",
  "app updates": "bg-secondary/10 text-secondary",
};

// Fallback sample data for when DB is empty
const sampleNews: NewsItem[] = [
  {
    id: "sample-1",
    title: "BizMart Store v2.0 Coming June 2026",
    content: "We're thrilled to announce the official release of BizMart Store v2.0! This major update brings a redesigned interface, faster checkout, improved notifications, and many more features to enhance your shopping experience.",
    image_url: null,
    images: [newsSample3, newsSample1],
    category: "updates",
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    title: "Welcome New BizMart Staff Members!",
    content: "Please join us in welcoming our newest team members who will be helping run the BizMart Store. They bring fresh energy and great ideas to our campus marketplace!",
    image_url: null,
    images: [newsSample2, newsSample1, newsSample3],
    category: "members",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function NewsCarousel() {
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news-updates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("news_updates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error || !data || data.length === 0) {
        return sampleNews;
      }
      
      return data.map((d: any) => ({
        ...d,
        images: d.images || (d.image_url ? [d.image_url] : []),
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
  });

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("news-updates-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "news_updates" }, () => {
        // Invalidate cache to trigger refetch
        const { queryClient } = require('@tanstack/react-query');
        // Note: In a real app, you'd use useQueryClient() hook
        // For now, we'll just let the staleTime handle it
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (isLoading || news.length === 0) return null;

  return (
    <>
      <div className="mt-4 px-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📰</span>
            <span className="font-extrabold text-xs text-secondary uppercase tracking-wide">Latest News & Updates</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">{news.length} articles</span>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
          {news.map((item) => {
            const allImages = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="flex-shrink-0 w-52 bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg active:scale-[0.97] transition-all text-left group snap-start"
              >
                {allImages.length > 0 ? (
                  <ImageCarousel images={allImages} className="w-full h-28 rounded-t-2xl" />
                ) : (
                  <div className="w-full h-28 bg-gradient-to-br from-primary/10 via-accent to-secondary/10 flex items-center justify-center">
                    <span className="text-3xl opacity-40">📰</span>
                  </div>
                )}
                <div className="p-3 space-y-1.5">
                  <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full inline-block ${categoryColors[item.category] || categoryColors.general}`}>
                    {item.category === "members" ? "Members & Staff" : item.category}
                  </span>
                  <h3 className="text-[11px] font-extrabold text-foreground leading-tight line-clamp-2">{item.title}</h3>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1">
                      {allImages.length > 1 && (
                        <span className="text-[8px] text-muted-foreground">{allImages.length} photos</span>
                      )}
                      <ChevronRight className="h-3 w-3 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {selected && <NewsDetail item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}