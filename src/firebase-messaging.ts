import React from "react";
import { requestUserPermission, setBackgroundMessageHandler } from "./firebase-messaging";
import { supabase } from "@/integrations/supabase/client";

// Exported functions for external use
export { requestUserPermission, setBackgroundMessageHandler };