import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useFCM } from "./hooks/useFCM";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Initialize FCM after app mount
const initializeFCM = async () => {
  const token = await fetch("/api/init-fcm", { method: "GET" }).then(r => r.json());
  // Token already stored via useFCM hook
};

initializeFCM();