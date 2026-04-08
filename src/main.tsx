import { createRoot } from "react-dom/client";
import App from "./App"; // <-- corrected import (no .tsx extension)
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);