import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promptForPush } from "@/hooks/useOneSignal";

export default function NotificationPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkPermission = useCallback(() => {
    // Only show on devices that support notifications
    if (!("Notification" in window)) return false;
    return Notification.permission === "default";
  }, []);

  useEffect(() => {
    // Initial check after short delay
    const timer = setTimeout(() => {
      if (checkPermission()) setVisible(true);
    }, 4000);

    // Re-check periodically in case user dismissed the OS prompt without allowing
    const interval = setInterval(() => {
      if (checkPermission()) {
        if (!dismissed) setVisible(true);
      } else {
        // Permission granted or permanently denied at OS level
        setVisible(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkPermission, dismissed]);

  // When permission changes (granted), hide immediately
  useEffect(() => {
    if (!("Notification" in window)) return;
    const handler = () => {
      if (Notification.permission !== "default") {
        setVisible(false);
      }
    };
    // Some browsers fire this
    navigator.permissions?.query({ name: "notifications" as PermissionName }).then((status) => {
      status.onchange = handler;
    }).catch(() => {});
  }, []);

  const handleAllow = async () => {
    // Hide banner first so it doesn't block the OS permission dialog
    setVisible(false);
    await promptForPush();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    // Re-show after 60 seconds if still not granted
    setTimeout(() => {
      if (checkPermission()) {
        setDismissed(false);
        setVisible(true);
      }
    }, 60000);
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
        <button onClick={handleDismiss} className="shrink-0 opacity-70 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
