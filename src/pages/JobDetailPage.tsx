import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, User, Star, CheckCircle2, AlertCircle, Play, Square, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

export default function JobDetailPage() {
  // ... rest of the component code remains unchanged
}