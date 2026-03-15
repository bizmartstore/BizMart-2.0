import { useState, useEffect, useCallback } from "react";
import { Bell, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promptForPush } from "@/hooks/useOneSignal";

export default function NotificationPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const checkPermission = useCallback(() => {
    // Only show on devices that support notifications
    if (!("Notification" in window)) return false;
    return Notification.permission === "default";
  }, []);

  useEffect(() => {
    // Initial check after short delay
    const timer = setTimeout(() => {
      if (checkPermission()) {
        console.log("[NotificationBanner] Showing banner - permission is default");
        setVisible(true);
      }
    }, 3000);

    // Re-check periodically in case user dismissed the OS prompt without allowing
    const interval = setInterval(() => {
      if (checkPermission()) {
        if (!dismissed) {
          console.log("[NotificationBanner] Permission still default, showing banner");
          setVisible(true);
        }
      } else {
        // Permission granted or permanently denied at OS level
        console.log("[NotificationBanner] Permission changed, hiding banner");
        setVisible(false);
      }
    }, 15000);

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
        console.log("[NotificationBanner] Permission changed to:", Notification.permission);
        setVisible(false);
      }
    };
    // Some browsers fire this
    navigator.permissions?.query({ name: "notifications" as PermissionName }).then((status) => {
      status.onchange = handler;
    }).catch(() => {});
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    setStatus("idle");
    console.log("[NotificationBanner] User clicked Allow");
    
    try {
      await promptForPush();
      // After calling promptForPush, check if permission was granted
      setTimeout(() => {
        if (Notification.permission === "granted") {
          setStatus("success");
          setTimeout(() => {
            setVisible(false);
            setStatus("idle");
          }, 2000);
        } else {
          setStatus("error");
          setLoading(false);
        }
      }, 1000);
    } catch (err) {
      console.error("[NotificationBanner] Error:", err);
      setStatus("error");
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    console.log("[NotificationBanner] User dismissed banner");
    setDismissed(true);
    setVisible(false);
    setStatus("idle");
    // Re-show after 60 seconds if still not granted
    setTimeout(() => {
      if (checkPermission()) {
        console.log("[NotificationBanner] Re-showing after timeout");
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
          {status === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-300" />
          ) : status === "error" ? (
            <X className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {status === "success" ? "Notifications Enabled!" :
             status === "error" ? "Failed to Enable" :
             "Enable Notifications"}
          </p>
          <p className="text-xs opacity-90">
            {status === "success" ? "You'll now receive updates on orders and messages." :
             status === "error" ? "Please try again or check browser settings." :
             "Get updates on orders, messages & promos!"}
          </p>
        </div>
        {status === "idle" && (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0 text-xs font-bold"
              onClick={handleAllow}
              disabled={loading}
            >
              {loading ? "Enabling..." : "Allow"}
            </Button>
            <button 
              onClick={handleDismiss} 
              className="shrink-0 opacity-70 hover:opacity-100 p-1"
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
        {status === "success" && (
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 text-xs font-bold"
            onClick={() => setVisible(false)}
          >
            Got it
          </Button>
        )}
        {status === "error" && (
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 text-xs font-bold"
            onClick={handleAllow}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}