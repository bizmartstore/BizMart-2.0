import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Megaphone, X } from "lucide-react";

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Use session storage so announcement shows on every app launch, not just once
    const delayTimer = setTimeout(() => {
      (supabase as any).from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1)
        .then(({ data }: any) => {
          if (data && data.length > 0) {
            const dismissedThisSession = sessionStorage.getItem('dismissed_announcement');
            if (dismissedThisSession !== data[0].id) {
              setAnnouncement(data[0]);
              setTimeout(() => setShow(true), 300);
            }
          }
        });
    }, 3200);

    return () => clearTimeout(delayTimer);
  }, []);

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
