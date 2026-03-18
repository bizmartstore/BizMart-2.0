import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register OneSignal service worker for push notifications
// Note: The OneSignal SDK will register the service worker specified in OneSignalInit.tsx
// when we call OneSignal.push() in the initialization process.

createRoot(document.getElementById("root")!).render(<App />);