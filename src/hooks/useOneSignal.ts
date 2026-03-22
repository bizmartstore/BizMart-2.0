import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

/* Declare global window interface for OneSignal */
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void>;
  }
}