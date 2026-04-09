import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Printer, MapPin, CheckCircle2, XCircle, Loader2, Palette, File } from "lucide-react";
import { format } from "date-fns";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { triggerLocalPushNotification } from "@/lib/pushNotifications";
import { notifyCustomerOrder } from "@/lib/notifications";   // ← NEW IMPORT

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PrintTab() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [copies, setCopies] = useState(1);
  const [pageSize, setPageSize] = useState<"short" | "long">("short");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifiedPrintIds = useRef<Set<string>>(new Set());   // ← NEW: track notified orders

  // ... existing code for loading, analyzing, etc. (unchanged) ...

  useEffect(() => {
    const channel = supabase
      .channel("admin-print-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_orders", filter: `user_id=eq.${user?.id}` }, (payload: any) => {
        // 👉 Detect a status change to "completed"
        if (payload.new?.status === "completed") {
          if (!notifiedPrintIds.current.has(payload.new.id)) {
            notifiedPrintIds.current.add(payload.new.id);
            const custId = payload.new.user_id;
            const msg = `Your print job “${payload.new.file_name}” is now **completed**!`;
            notifyCustomerOrder(custId, msg);
          }
        }
      })
      .subscribe();

    pollIntervalRef.current = setInterval(() => {
      load(true);
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [user]);

  // ... rest of component unchanged except for the added import and notifiedPrintIds ref