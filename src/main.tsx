import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Messaging } from "./firebase"; // Ensure FCM is loaded

// Initialize Firebase messaging before rendering
import { getMessaging, getToken } from "firebase/messaging";
import { useEffect } from "react";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// FCM initialization (runs once)
getMessaging().getToken().then((token) => {
  console.log("FCM Token:", token);
  // Token will be saved via AuthContext on login
});

useEffect(() => {
  // No additional code needed here
}, []);