import { useState, useRef } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Printer, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

// ... existing code ...

export default function PrintServicePage() {
  // ... existing state declarations ...
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<any[]>([]);

  // ... existing file change handler ...
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type
    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    // Validate file size (50MB max)
    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    // Validate filename (no special characters that could be used for path traversal)
    const filename = selected.name;
    if (/[<>:"/\\|?*]/.test(filename)) {
      toast.error("Filename contains invalid characters");
      return;
    }

    setFile(selected);
    setPages([]);
    await analyzePdf(selected);
  };

  // ... rest of component ...

  return (
    // ... component JSX ...
  );
}