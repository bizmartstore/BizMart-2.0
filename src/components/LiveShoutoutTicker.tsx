import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type Shoutout = {
  id: string;
  title: string;
  message: string;
  icon: string | null;
  created_at: string;
};

export default function LiveShoutoutTicker() {
  const { user } = useAuth();
  const [items, setItems] = useState<Shoutout[]>([]);

  const loadShoutouts = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("notification_logs")
      .select("id, title, message, icon, created_at")
      .eq("type", "live_shoutout")
      .is("target_role", null)
      .is("target_user_id", null)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setItems(data);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    loadShoutouts();

    const channel = supabase
      .channel("live-shoutout-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_logs",
          filter: "type=eq.live_shoutout",
        },
        () => loadShoutouts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadShoutouts, user]);

  const tickerItems = useMemo(() => {
    if (items.length === 0) return [];
    const latestThree = items.slice(0, 3);
    return [...latestThree, ...latestThree];
  }, [items]);

  // Don't render if no shoutouts
  if (items.length === 0) return null;

  return (
    <section className="px-3 mt-1.5" aria-label="Live shoutouts">
      <div className="relative overflow-hidden rounded-lg border border-primary/15 bg-muted/30">
        <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-muted/30 to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-muted/30 to-transparent z-10" />

        <div className="flex items-center overflow-hidden py-1.5 px-1">
          <div className="flex items-center gap-1 px-2 flex-shrink-0 z-20 bg-muted/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--success))] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(var(--success))]" />
            </span>
            <span className="text-[9px] font-bold uppercase text-primary tracking-wider">Live</span>
          </div>
          <div className="flex w-max items-center gap-4 animate-marquee [animation-duration:20s]">
            {tickerItems.map((item, index) => (
              <p
                key={`${item.id}-${index}`}
                className="text-[10px] font-medium whitespace-nowrap text-muted-foreground"
              >
                <span className="text-foreground font-semibold">{item.title}</span>
                <span className="mx-1 text-border">—</span>
                <span>{item.message}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
