import { useEffect } from "react";
import { useFCM } from "./firebase-messaging";

export function useFCM() {
  const { token } = useFCM();
  // Expose token for components that need it
  return token;
}