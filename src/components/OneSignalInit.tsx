import { useEffect } from "react";
import { useOneSignal } from "@/hooks/useOneSignal";

export default function OneSignalInit() {
  const { initOneSignal } = useOneSignal();

  useEffect(() => {
    // Initialize OneSignal on mount    initOneSignal();
  }, [initOneSignal]);

  return null;
}