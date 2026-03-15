import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOneSignal } from "@/hooks/useOneSignal";

export default function NotificationPromptBanner() {
  const { requestPermission, isSupported } = useOneSignal();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    const permission = await getNotificationPermission();
    return permission === "default";
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;

    const checkAndShow = async () => {
      const shouldShow = await checkPermission();
      if (shouldShow && !dismissed) {
        // Show after 5 seconds
        setTimeout(() => setVisible(true), 5000);
      }
      setPermissionChecked(true);
    };

    checkAndShow();

    // Re-check every 30 seconds
    const interval = setInterval(checkAndShow, 30000);
    return () => clearInterval(interval);
  }, [checkPermission, dismissed, isSupported]);

  // Hide when permission is granted/denied
  useEffect(() => {
    if (!permissionChecked) return;
    
    const checkStatus = async () => {
      const permission = await getNotificationPermission();
      if (permission !== "default") {
        setVisible(false);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [permissionChecked]);

  const handleAllow = async () => {
    console.log("[NotificationPromptBanner] Allow button clicked");
    setVisible(false);
    const granted = await requestPermission();
    if (granted) {
      console.log("[NotificationPromptBanner] Permission granted");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    // Re-show after 2 minutes if still not granted
    setTimeout(async () => {
      const shouldShow = await checkPermission();
      if (shouldShow) {
        setDismissed(false);
        setVisible(true);
      }
    }, 120000);
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
        >
          Allow
        </Button>
        <button 
          onClick={handleDismiss} 
          className="shrink-0 opacity-70 hover:opacity-100 p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}