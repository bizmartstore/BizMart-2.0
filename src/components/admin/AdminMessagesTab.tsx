import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext"; // <-- Added
import { supabase } from "@/integrations/supabase/client";