import { useOneSignal } from "@/hooks/useOneSignal";
import NotificationPromptBanner from "./NotificationPromptBanner";

export default function OneSignalInit() {
  useOneSignal();

  return <NotificationPromptBanner />;
}