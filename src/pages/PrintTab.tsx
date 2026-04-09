/// <reference types="react" />
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
  const notifiedPrintIds = useRef<Set<string>>(new Set());   // ← NEW: track notified print orders

  const load = async (silent = false) => {
    if (!isMountedRef.current) return;
    if (!silent) setLoading(true);
        try {
      const { data: printData, error } = await (supabase as any).from("print_orders").select("*").order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const userIds = (printData || []).map((o: any) => o.user_id).filter(Boolean);
      let enriched = printData || [];
      
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, first_name, last_name, email, grade_level, section")
          .in("user_id", userIds);
        
        const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]));
        enriched = printData?.map((o: any) => ({
          ...o,
          profiles: profileMap.get(o.user_id) || null,
        }));
      }
      
      setPages(enriched);
    } catch (e: any) {
      console.error("Failed to load print orders:", e);
      if (!silent) toast.error("Failed to load print orders: " + e.message);
    } finally {
      if (!silent && isMountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    load();
    
    const channel = supabase.channel("admin-print-orders-realtime")
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

  // ... rest of component unchanged except for added import and notifiedPrintIds ref