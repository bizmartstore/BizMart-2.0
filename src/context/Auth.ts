import { createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

// Create context
export const AuthContext = createContext();

// Hook that returns the context value
export function useAuth() {
  return useContext(AuthContext);
}