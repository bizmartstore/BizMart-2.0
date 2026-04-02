import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Printer, Upload, FileText, Check, Calendar, Clock, 
  MapPin, Truck, Loader2, ChevronDown, ChevronUp, Eye, Trash2,
  Info, HelpCircle, ShieldCheck, Zap, AlertCircle
} from "lucide-react";

// ✅ FIXED PDF.js IMPORT
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

// ✅ USE LOCAL WORKER (NO CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PRICING = {
  short: { bw: 3.00, color: 8.00 },
  long: { bw: 5.00, color: 10.00 },
};

type PaperSize = "short" | "long";
type DeliveryType = "pickup" | "delivery";

interface PageInfo {
  pageNumber: number;
  isColor: boolean;
  selected: boolean;
}

function isPageColored(imageData: ImageData, threshold = 0.01): boolean {
  const data = imageData.data;
  let coloredPixels = 0;

  for (let i = 0; i < data.length; i += 40) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const maxDiff = Math.max(
      Math.abs(r - g),
      Math.abs(g - b),
      Math.abs(r - b)
    );

    if (maxDiff > 15) coloredPixels++;
  }

  const sampledPixels = data.length / 40;
  return (coloredPixels / sampledPixels) > threshold;
}

export default function PrintServicePage() {
  const { user, profile } = useAuth();
  const { storeOpen, gcashFee } = useAppSettings();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSize>("short");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("pickup");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setPickupDate(tomorrow.toISOString().split("T")[0]);
    setPickupTime("10:00");
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast.error("Please upload a PDF file only");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setPages([]);
    setFileUrl(null);
    setPdfError(null);

    await uploadFile(selectedFile);
  };

  const uploadFile = async (pdfFile: File) => {
    setUploading(true);
    setPdfError(null);

    try {
      const path = `print-files/${user?.id}/${Date.now()}.pdf`;

      const { error } = await supabase.storage
        .from("print-files")
        .upload(path, pdfFile);

      if (error) throw error;

      const { data } = supabase.storage
        .from("print-files")
        .getPublicUrl(path);

      setFileUrl(data.publicUrl);

      await analyzePDF(pdfFile);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    }

    setUploading(false);
  };

  const analyzePDF = async (pdfFile: File) => {
    setAnalyzing(true);
    setPdfError(null);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
      }).promise;

      const numPages = pdf.numPages;
      const pageInfos: PageInfo[] = [];

      // ⚠️ LIMIT for performance
      const maxPages = Math.min(numPages, 30);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);

        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");

        if (ctx) {
          await page.render({ canvas, viewport }).promise;

          const imageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          const isColor = isPageColored(imageData);

          pageInfos.push({
            pageNumber: i,
            isColor,
            selected: true,
          });
        }
      }

      setPages(pageInfos);

      toast.success(`PDF analyzed: ${numPages} pages detected`);
    } catch (e: any) {
      console.error("PDF analysis failed:", e);

      setPdfError("Failed to analyze PDF. Please try another file.");
      toast.error("PDF analysis failed");
    }

    setAnalyzing(false);
  };

  const selectedPages = pages.filter(p => p.selected);
  const bwPages = selectedPages.filter(p => !p.isColor).length;
  const colorPages = selectedPages.filter(p => p.isColor).length;

  const pricing = PRICING[paperSize];

  const totalCost =
    bwPages * pricing.bw +
    colorPages * pricing.color +
    (deliveryType === "delivery" ? gcashFee : 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="px-3 mt-4 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Printer className="h-7 w-7 mx-auto text-primary mb-2" />
          <h1 className="font-bold text-lg">Campus Print Service</h1>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button onClick={() => fileInputRef.current?.click()}>
          Upload PDF
        </Button>

        {analyzing && <p>Analyzing...</p>}
        {pdfError && <p className="text-red-500">{pdfError}</p>}

        {pages.length > 0 && (
          <div className="mt-4">
            <p>Total Pages: {pages.length}</p>
            <p>B&W: {bwPages}</p>
            <p>Color: {colorPages}</p>
            <p>Total Cost: ₱{totalCost.toFixed(2)}</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}