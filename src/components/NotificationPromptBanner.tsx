"use client";

import { useState, useEffect, useRef } from "react";
import { useOneSignal } from "@/hooks/useOneSignal";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    OneSignal?: any;
  }
}

function getOneSignal() {
  return new Promise<any>((resolve) => {
    if (window.OneSignal && typeof window.OneSignal.login === "function") {
      resolve(window.OneSignal);
    } else {
      const interval = setInterval(() => {
        if (window.OneSignal && typeof window.OneSignal.login === "function") {
          clearInterval(interval);
          resolve(window.OneSignal);
        }
      }, 100);
    }
  });
}

export default function NotificationPromptBanner() {
  const [visible, setVisible] = useState(false);
  const onesignal = useOneSignal();

  // Ensure SDK is ready before proceeding
  useEffect(() => {
    if (!onesignal) return;
    const checkPermission = async () => {
      const permission = await Notification.permission;
      if (permission === "default") {
        setVisible(true);
      }
    };
    const timer = setTimeout(checkPermission, 4000);
    return () => clearTimeout(timer);
  }, [onesignal]);

  const handleAllow = async () => {
    if (!visible) return;
    setVisible(false);
    try {
      await promptForPush(); // This triggers the native permission prompt
    } catch (e) {
      console.error("promptForPush failed:", e);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary/80">
      <div className="bg-card rounded-2xl p-4 shadow-lg max-w-sm mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <div>
            <p className="font-semibold">Enable Notifications</p>
            <p className="text-sm text-primary-foreground">
              Get updates on orders, messages & promos!
            </p>
          </div>
        </div>
        <Button onClick={handleAllow} className="w-full text-primary-foreground">
          Allow        </Button>
        <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}