import { useState, useEffect } from "react";
import { Bell, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promptForPush } from "@/hooks/useOneSignal";

export default function NotificationPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;
    
    // Check if notifications are supported
    if (!("Notification" in window)) return;

    // If already granted, do not show
    if (Notification.permission === "granted") {
      setVisible(false);
      return;
    }

    // Check if OneSignal is likely to be available
    if (!window.OneSignal && !window.OneSignalDeferred) {
      setVisible(false);
      return;
    }

    // Check if we have a dismiss timestamp in localStorage
    const dismissedUntil = Number(localStorage.getItem("onesignal_notif_banner_dismissed") || "0");
    const now = Date.now();
    if (dismissedUntil > now) {
      setVisible(false);
      return;
    }

    // Show after a short delay to avoid annoyance on first load
    const timer = setTimeout(() => {
      setVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      await promptForPush();
    } catch (error) {
      console.error("Failed to request push permission:", error);
    }
    setIsRequesting(false);
    setVisible(false);
    // Dismiss for 1 day
    localStorage.setItem("onesignal_notif_banner_dismissed", (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  const handleDismiss = () => {
    setVisible(false);
    // Dismiss for 1 day
    localStorage.setItem("onesignal_notif_banner_dismissed", (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  if (!visible) return null;

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
          disabled={isRequesting}
        >
          {isRequesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Allow"
          )}
        </Button>
        <button 
          onClick={handleDismiss} 
          className="shrink-0 opacity-70 hover:opacity-100"
          disabled={isRequesting}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}