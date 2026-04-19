import { useEffect, useState, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

export default function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const hasShownUpdate = useRef(false);
  const updateCheckCount = useRef(0);
  const userDismissed = useRef(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        // Only check for updates every 1 hour instead of every minute
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  useEffect(() => {
    // Only show update prompt once after first load and after user has interacted
    // Don't show on first load at all (updateCheckCount.current > 1)
    // Don't show if user dismissed it
    if (needRefresh && !hasShownUpdate.current && updateCheckCount.current > 1 && !userDismissed.current) {
      hasShownUpdate.current = true;
      setShowUpdate(true);
    }
    updateCheckCount.current++;
  }, [needRefresh]);

  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true);
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (e) {
      console.error("Update failed:", e);
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    userDismissed.current = true;
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm font-semibold">A new update is available!</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDismiss}
          className="text-primary-foreground/70 text-xs font-medium px-2 py-1.5 hover:text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={handleUpdate}
          className="bg-primary-foreground text-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/90"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}