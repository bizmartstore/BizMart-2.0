// src/context/AuthContext.tsx
// ... existing imports
import { messaging, isSupported, VAPID_KEY } from "@/firebase";
// ...
// Inside the useEffect that loads profile:
useEffect(() => {
  if (!user) return;
  setLoading(true);
  try {
    // Check if FCM is supported (isSupported is a boolean, not a function)
    const supported = isSupported; // <-- fixed: removed parentheses
    if (!supported) {
      // ... existing logic
    }
    // ... rest unchanged