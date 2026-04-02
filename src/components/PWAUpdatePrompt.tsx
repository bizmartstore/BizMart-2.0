import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";

export default function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  useEffect(() => {
    if (needRefresh) setShowUpdate(true);
  }, [needRefresh]);

  const handleUpdate = async () => {
    try {
      await updateServiceWorker(true);
      // Force reload after the service worker activates
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      console.error("Update failed:", e);
      // Fallback: just reload the page
      window.location.reload();
    }
  };

  const handleDismiss = () => {
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
          className="text-primary-foreground/70 text-xs font-medium px-2 py-1.5"
        >
          Later
        </button>
        <button
          onClick={handleUpdate}
          className="bg-primary-foreground text-primary text-xs font-bold px-3 py-1.5 rounded-lg"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}
