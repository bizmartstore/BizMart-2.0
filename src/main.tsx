import { getMessaging, getToken } from "firebase/messaging";
import { useEffect } from "react";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// FCM initialization (runs once)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      const messaging = getMessaging();
      getToken(messaging, {
        vapidKey: "BLiQ3xFdLjDAkx3Oa5ivCLI58eix9VOaGyZvBBdUKACmQcFzRDI-f80moCbq08ZKOFcy53TKTFqDu34cG0XIyiE"
      }).then((currentToken) => {
        if (currentToken) {
          console.log("FCM Token:", currentToken);
          // Send token to server via AuthContext
        }
      }).catch((err) => {
        console.error("FCM token error:", err);
      });
    });
}

useEffect(() => {
  // No additional code needed here
}, []);