import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkStatus = useCallback(async () => {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return false;
    
    // Only show if the user hasn't made a choice yet (permission is 'default')
    const permission = OneSignal.Notifications.permission;
    return permission === "default";
  }, []);

  useEffect(() => {
    // Delay showing the banner so it's not the first thing they see
    const timer = setTimeout(async () => {
      if (await checkStatus()) setVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [checkStatus]);

  const handleAllow = async () => {
    setVisible(false);
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;

    try {
      console.log("[OneSignal] User clicked Allow. Triggering prompt...");
      // This click satisfies the "User Gesture" requirement for mobile browsers
      await OneSignal.Slidedown.promptPush();
    } catch (e) {
      console.error("[OneSignal] Prompt failed:", e);
      // Fallback to native prompt if slidedown fails
      await OneSignal.Notifications.requestPermission();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300">
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg">
        <div className="bg-primary-foreground/20 rounded-full p-2 shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Enable Notifications</p>
          <p className="text-xs opacity-90">Get updates on orders, messages & promos!</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0 text-xs font-bold"
          onClick={handleAllow}
        >
          Allow
        </Button>
        <button onClick={handleDismiss} className="shrink-0 opacity-70 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}