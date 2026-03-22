import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationPromptBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if OneSignal is available and permission is default
      if (window.OneSignal) {
        window.OneSignal.User.PushSubscription.getOptedIn()
          .then((isSubscribed: boolean) => {
            if (!isSubscribed) {
              setVisible(true);
            }
          })
          .catch(() => setVisible(true));
      } else {
        // Fallback: show banner after 3 seconds if OneSignal not ready
        setVisible(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setVisible(false);
    if (window.OneSignal) {
      try {
        await window.OneSignal.showSlidedownPrompt();
      } catch (e) {
        console.warn("OneSignal prompt failed:", e);
      }
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] p-3 animate-in slide-in-from-top duration-500">
      <div className="bg-primary text-primary-foreground rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-3 border border-white/20">
        <div className="bg-white/20 p-2 rounded-full">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold leading-tight">Enable Notifications</p>
          <p className="text-[10px] opacity-80">Get alerts for orders and messages!</p>
        </div>
        <Button size="sm" variant="secondary" className="h-8 text-[10px] font-bold px-4" onClick={handleAllow}>
          Allow
        </Button>
        <button onClick={() => setVisible(false)} className="p-1 opacity-50"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}