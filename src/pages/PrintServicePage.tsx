import { useState, useRef } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Printer, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PrintServicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [bwPages, setBwPages] = useState<number>(0);
  const [coloredPages, setColoredPages] = useState<number>(0);
  const [pageSize, setPageSize] = useState<"short" | "long">("short");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [cost, setCost] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRICES = {
    short: { bw: 2, color: 5 },
    long: { bw: 3, color: 7 },
  };

  const analyzePdf = async (file: File) => {
    // Simulate PDF analysis for demo
    setTotalPages(Math.floor(Math.random() * 20) + 1);
    setBwPages(Math.floor(Math.random() * 15) + 1);
    setColoredPages(Math.floor(Math.random() * 10) + 1);
    
    const bwCost = bwPages * PRICES[pageSize].bw;
    const colorCost = coloredPages * PRICES[pageSize].color;
    setCost(bwCost + colorCost);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    // Validate file size (50MB max)
    if (selected.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    // Validate filename (no special characters)
    const filename = selected.name;
    if (/[<>:"/\\|?*]/.test(filename)) {
      toast.error("Filename contains invalid characters");
      return;
    }

    setFile(selected);
    setPages([]);
    await analyzePdf(selected);
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!file) {
      toast.error("Please select a PDF file");
      return;
    }
    if (!pickupDate || !pickupTime) {
      toast.error("Please select pickup date and time");
      return;
    }

    setSubmitting(true);
    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("print-orders")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("print-orders")
        .getPublicUrl(fileName);

      // Create print order record
      const { error: insertError } = await (supabase as any).from("print_orders").insert({
        user_id: user.id,
        file_url: publicUrl,
        file_name: file.name,
        total_pages: totalPages,
        bw_pages: bwPages,
        colored_pages: coloredPages,
        page_size: pageSize,
        delivery_type: deliveryType,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        cost: cost,
        status: "pending",
      });

      if (insertError) throw insertError;

      toast.success("Print order submitted successfully!");
      navigate("/orders");
    } catch (e: any) {
      toast.error("Failed to submit print order: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // ... component JSX ...
  );
}