import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // <-- Added
import { supabase } from "@/integrations/supabase/client";