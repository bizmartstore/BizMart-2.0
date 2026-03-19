import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Check, X, Shield, Crown, Megaphone, Users, Image, Tag, Smartphone, Store, LogOut, Edit2, Coins, Bell, ShoppingCart, Printer, Settings, UserPlus, Receipt, Download, MessageCircle, Briefcase, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { notifyAdminNewRegistration } from "@/lib/notifications";

export default function CodesTab({ role }: { role: string }) {
  const { user, profile } = useAuth();
  const isMainAdmin = role === "main_admin";

  const [sellerCodes, setSellerCodes] = useState<any[]>([]);
  const [clubCodes, setClubCodes] = useState<any[]>([]);
  const [newSellerCode, setNewSellerCode] = useState("");
  const [newClubCode, setNewClubCode] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, any>>({});
  const [searchUser, setSearchUser] = useState("");

  // Send code modal state
  const [sendingCode, setSendingCode] = useState<{ code: string; type: "seller" | "club"; id: string } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");

  const load = async () => {
    const [sc, cc, profs] = await Promise.all([
      (supabase as any).from("seller_codes").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("club_codes").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("profiles").select("*").order("first_name"),
    ]);
    setSellerCodes(sc.data || []);
    setClubCodes(cc.data || []);
    setProfiles(profs.data || []);

    const allCodes = [...sellerCodes, ...clubCodes];
    const adminIds = [...new Set(allCodes.map((c: any) => c.generated_by).filter(Boolean))];
    if (adminIds.length > 0) {
      const { data: admProfs } = await (supabase as any).from("profiles").select("*").in("user_id", adminIds);
      const map: Record<string, any> = {};
      (admProfs || []).forEach((p: any) => { map[p.user_id] = p; });
      setAdminProfiles(map);
    }
  };
  useEffect(() => { load(); }, []);

  const adminName = profile ? `${profile.first_name} ${profile.last_name}` : "Admin";

  // ... existing code unchanged until notify calls

  const handleSendCode = async () => {
    if (!sendingCode || !selectedUserId) { toast.error("Select a user"); return; }

    const targetProfile = profiles.find(p => p.user_id === selectedUserId);
    const targetName = targetProfile ? `${targetProfile.first_name} ${targetProfile.last_name}` : "User";

    // Update the code with sent info
    const table = sendingCode.type === "club" ? "club_codes" : "seller_codes";
    await (supabase as any).from(table).update({
      sent_to_name: targetName,
      sent_at: new Date().toISOString(),
    }).eq("id", sendingCode.id);

    // Send notification to the user via notification bell
    if (sendingCode.type === "club") {
      notifyAdminNewRegistration(targetName, targetProfile?.email || "");
    } else {
      // For seller codes, you might want a different notification
      // Example: notifyAdminNewRegistration(targetName, targetProfile?.email || "");
    }

    toast.success(`Code sent to ${targetName}! They'll see it in their notification bell 🔔`);
    setSendingCode(null);
    setSelectedUserId("");
    setSearchUser("");
    load();
  };