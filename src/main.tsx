import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { useFCM } from "./hooks/useFCM";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Initialize FCM after app mountuseFCM(); // Hook call ensures token registration on mount