import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promptForPush } from "@/hooks/useOneSignal";

export default function NotificationPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkPermission = useCallback(() => {
    if (!("Notification" in window)) return false;
    return Notification.permission === "default";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (checkPermission()) setVisible(true);
    }, 4000);

    const interval = setInterval(() => {
      if (checkPermission()) {
        if (!dismissed) setVisible(true);
      } else {
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
    navigator.permissions?.query({ name: "notifications" as PermissionName }).then((status) => {
      status.onchange = handler;
    }).catch(() => {});
  }, []);

  const handleAllow = async () => {
    setVisible(false);
    await promptForPush();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="text-lg">🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Enable Notifications</p>
            <p className="text-[10px] text-primary-foreground opacity-80">Get updates on orders, messages & promos!</p>
          </div>
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