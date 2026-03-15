import { useEffect } from "react";
import { useOneSignal } from "@/hooks/useOneSignal";

/**
 * OneSignal Initialization Component
 * This component initializes OneSignal SDK on app load
 */
export default function OneSignalInit() {
  const { isSupported } = useOneSignal();

  useEffect(() => {
    // OneSignal is initialized in useOneSignal hook
    // This component just ensures the hook is mounted
    if (isSupported) {
      console.log('[OneSignalInit] OneSignal supported and initializing...');
    } else {
      console.log('[OneSignalInit] Push notifications not supported in this browser');
    }
  }, [isSupported]);

  return null; // This component doesn't render anything
}