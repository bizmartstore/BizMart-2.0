import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Megaphone, X } from "lucide-react";

export default function AnnouncementPopup() {
  const [show, setShow] = useState(false);

  const { data: announcement } = useQuery({
    queryKey: ['announcement'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) return null;
      return data[0];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 2,
  });

  useEffect(() => {
    if (announcement) {
      const delayTimer = setTimeout(() => {
        const dismissedThisSession = sessionStorage.getItem('dismissed_announcement');
        if (dismissedThisSession !== announcement.id) {
          setShow(true);
        }
      }, 3200);

      return () => clearTimeout(delayTimer);
    }
  }, [announcement]);

  if (!show || !announcement) return null;

  const dismiss = () => {
    sessionStorage.setItem('dismissed_announcement', announcement.id);
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-foreground/50 p-6" onClick={dismiss}>
      <div
        className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">Announcement</span>
        </div>
        <h3 className="font-extrabold text-xl text-foreground mb-2 leading-tight">{announcement.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{announcement.message}</p>
        <Button onClick={dismiss} className="w-full rounded-xl h-11 font-bold">Got it!</Button>
      </div>
    </div>
  );
}