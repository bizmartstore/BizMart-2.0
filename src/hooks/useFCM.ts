// src/hooks/useFCM.ts
// ... existing imports and code
// Inside the function where upsert is called:
const { error } = await supabase.from("user_push_tokens").upsert({
  user_id: user.id,
  role: profile?.role || "customer",
  fcm_token: token,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}) as any; // <-- cast to any to satisfy TypeScript
```<dyad-write path="src/context/AuthContext.tsx" description="Fix isSupported usage (it's a boolean, not a function)">
```ts// src/context/AuthContext.tsx
// ... existing imports
import { messaging, isSupported, VAPID_KEY } from "@/firebase";
// ...
useEffect(() => {
  if (!user) return;
  setLoading(true);
  try {
    // isSupported is a boolean flag, not a function call
    const supported = isSupported; // <-- fixed: removed parentheses
    if (!supported) {
      // ... existing logic
    }
    // ... rest unchanged