import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

/* Declare global window interface for OneSignal */
declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
    OneSignal?: any;
  }
}