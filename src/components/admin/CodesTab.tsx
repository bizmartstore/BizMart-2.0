import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Send, Search, X } from "lucide-react";
import { sendNotification } from "@/lib/notifications";

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
    console.log("CodesTab load - seller_codes:", sc.data?.length, sc.error);
    console.log("CodesTab load - club_codes:", cc.data?.length, cc.error);
    console.log("CodesTab load - profiles:", profs.data?.length, profs.error);
    setSellerCodes(sc.data || []);
    setClubCodes(cc.data || []);
    setProfiles(profs.data || []);

    // Build admin profiles map from generated_by IDs
    const allCodes = [...(sc.data || []), ...(cc.data || [])];
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

  // ─── Seller Codes ───
  const addSellerCode = async () => {
    if (!newSellerCode.trim()) return;
    await (supabase as any).from("seller_codes").insert({
      code: newSellerCode.trim().toUpperCase(),
      generated_by: user?.id,
    });
    setNewSellerCode("");
    load();
    toast.success("Seller code added!");
  };

  const generateSellerCodes = async () => {
    const batch = Array.from({ length: 3 }, () => `SELL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    await (supabase as any).from("seller_codes").insert(batch.map(c => ({ code: c, generated_by: user?.id })));
    load();
    toast.success("3 seller codes generated!");
  };

  // ─── Club Codes ───
  const addClubCode = async () => {
    if (!newClubCode.trim()) return;
    await (supabase as any).from("club_codes").insert({
      code: newClubCode.trim().toUpperCase(),
      generated_by: user?.id,
    });
    setNewClubCode("");
    load();
    toast.success("Club code added!");
  };

  const generateClubCodes = async () => {
    const batch = Array.from({ length: 5 }, () => `BZM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    await (supabase as any).from("club_codes").insert(batch.map(c => ({ code: c, generated_by: user?.id })));
    load();
    toast.success("5 club codes generated!");
  };

  const deleteSellerCode = async (id: string) => {
    await (supabase as any).from("seller_codes").delete().eq("id", id);
    load();
    toast.success("Code removed");
  };

  const deleteClubCode = async (id: string) => {
    await (supabase as any).from("club_codes").delete().eq("id", id);
    load();
    toast.success("Code removed");
  };

  // ─── Send Code to User via Notification ───
  const handleSendCode = async () => {
    if (!sendingCode || !selectedUserId) { toast.error("Select a user"); return; }

    const targetProfile = profiles.find(p => p.user_id === selectedUserId);
    const targetName = targetProfile ? `${targetProfile.first_name} ${targetProfile.last_name}` : "User";

    // Update the code with sent info
    const table = sendingCode.type === "seller" ? "seller_codes" : "club_codes";
    await (supabase as any).from(table).update({
      sent_to_name: targetName,
      sent_to_user_id: selectedUserId,
      sent_at: new Date().toISOString(),
    }).eq("id", sendingCode.id);

    // Send notification to the user via notification bell
    if (sendingCode.type === "club") {
      sendNotification({
        title: "🎉 Welcome to BizMart Club!",
        message: `Congratulations ${targetName}! 🥳 Your ₱50 BizMart Club registration has been confirmed. Here's your exclusive membership code: 🎟️ ${sendingCode.code} — Go to BizMart Club page and enter this code to activate your membership. Enjoy exclusive perks and rewards! 🌟`,
        icon: "👑",
        link: "/club",
        type: "club_code_sent",
        targetUserId: selectedUserId,
      });
    } else {
      sendNotification({
        title: "🏪 You received a Seller Code!",
        message: `${adminName} sent you a Seller code: ${sendingCode.code}. Use it to register as a seller in the app!`,
        icon: "🏪",
        link: "/sellers",
        type: "seller_code_sent",
        targetUserId: selectedUserId,
      });
    }

    toast.success(`Code sent to ${targetName}! They'll see it in their notification bell 🔔`);
    setSendingCode(null);
    setSelectedUserId("");
    setSearchUser("");
    load();
  };

  const filteredProfiles = profiles.filter(p =>
    p.user_id !== user?.id &&
    (`${p.first_name} ${p.last_name}`.toLowerCase().includes(searchUser.toLowerCase()) ||
    p.email.toLowerCase().includes(searchUser.toLowerCase()))
  );

  const getAdminLabel = (generatedBy: string | null) => {
    if (!generatedBy) return null;
    const prof = adminProfiles[generatedBy];
    if (!prof) return null;
    return `${prof.first_name} ${prof.last_name}`;
  };

  return (
    <div className="space-y-4 pb-6">
      {/* ─── Send Code Modal ─── */}
      {sendingCode && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSendingCode(null)}>
          <div className="bg-card rounded-2xl border border-border p-4 w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm flex items-center gap-2">
              {sendingCode.type === "club" ? <span className="text-lg">👑</span> : <Send className="h-4 w-4 text-primary" />}
              {sendingCode.type === "club" ? "Send Club Membership Code" : "Send Seller Code"}
            </h3>
            {sendingCode.type === "club" && (
              <div className="bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 rounded-lg p-2.5">
                <p className="text-[11px] text-[hsl(var(--success))] font-bold">✅ Customer paid ₱50 registration</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Send this code so they can activate their BizMart Club membership</p>
              </div>
            )}
            <div className="bg-muted rounded-lg p-3 text-center">
              <span className="font-mono font-extrabold text-primary text-xl">{sendingCode.code}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sendingCode.type === "seller" ? "Seller Code" : "BizMart Club Membership Code"}</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                placeholder="Search student..."
                className="pl-8 text-xs h-8"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredProfiles.slice(0, 20).map(p => (
                <button
                  key={p.user_id}
                  onClick={() => setSelectedUserId(p.user_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedUserId === p.user_id ? "bg-primary/10 border border-primary" : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <span className="font-bold">{p.first_name} {p.last_name}</span>
                  <span className="text-muted-foreground ml-1">• {p.email}</span>
                </button>
              ))}
              {filteredProfiles.length === 0 && <p className="text-center text-[10px] text-muted-foreground py-2">No users found</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setSendingCode(null)} variant="outline" size="sm" className="flex-1">Cancel</Button>
              <Button onClick={handleSendCode} size="sm" className="flex-1 gap-1" disabled={!selectedUserId}>
                <Send className="h-3 w-3" />Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Seller Codes ─── */}
      <div className="bg-card rounded-xl p-3 border border-border space-y-2">
        <span className="font-bold text-sm">🏪 Seller Codes</span>
        <div className="flex gap-2">
          <Input value={newSellerCode} onChange={e => setNewSellerCode(e.target.value.toUpperCase())} placeholder="Enter code" className="text-sm" />
          <Button onClick={addSellerCode} size="sm">Add</Button>
        </div>
        <Button onClick={generateSellerCodes} size="sm" variant="outline" className="w-full gap-1">
          <Plus className="h-3 w-3" />Generate 3 Seller Codes
        </Button>
        <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
          {sellerCodes.map(c => (
            <div key={c.id} className="bg-muted/50 rounded-lg px-3 py-2 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold">{c.code}</span>
                <div className="flex items-center gap-1">
                  <span className={c.is_used ? "text-muted-foreground" : "text-[hsl(var(--success))] font-bold"}>
                    {c.is_used ? "Used" : "Available"}
                  </span>
                  {!c.is_used && (
                    <>
                      <button onClick={() => setSendingCode({ code: c.code, type: "seller", id: c.id })} className="p-1 text-primary hover:bg-primary/10 rounded" title="Send to customer">
                        <Send className="h-3 w-3" />
                      </button>
                      <button onClick={() => deleteSellerCode(c.id)} className="p-1 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Show who generated and sent */}
              <div className="flex flex-wrap gap-x-3 text-[9px] text-muted-foreground">
                {c.generated_by && getAdminLabel(c.generated_by) && (
                  <span>Generated by: <span className="font-bold text-foreground">{getAdminLabel(c.generated_by)}</span></span>
                )}
                {c.sent_to_name && (
                  <span>Sent to: <span className="font-bold text-primary">{c.sent_to_name}</span></span>
                )}
                {c.sent_at && (
                  <span>{new Date(c.sent_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
          {sellerCodes.length === 0 && <p className="text-center text-[10px] text-muted-foreground py-2">No seller codes</p>}
        </div>
      </div>

      {/* ─── Club Codes ─── */}
      <div className="bg-card rounded-xl p-3 border border-border space-y-2">
        <span className="font-bold text-sm">👑 Club Codes</span>
        <div className="flex gap-2">
          <Input value={newClubCode} onChange={e => setNewClubCode(e.target.value.toUpperCase())} placeholder="Enter code" className="text-sm" />
          <Button onClick={addClubCode} size="sm">Add</Button>
        </div>
        <Button onClick={generateClubCodes} size="sm" variant="outline" className="w-full gap-1">
          <Plus className="h-3 w-3" />Generate 5 Club Codes
        </Button>
        <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
          {clubCodes.map(c => (
            <div key={c.id} className="bg-muted/50 rounded-lg px-3 py-2 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold">{c.code}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[hsl(var(--success))] font-bold">Available</span>
                  <button onClick={() => setSendingCode({ code: c.code, type: "club", id: c.id })} className="p-1 text-primary hover:bg-primary/10 rounded" title="Send to customer">
                    <Send className="h-3 w-3" />
                  </button>
                  <button onClick={() => deleteClubCode(c.id)} className="p-1 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 text-[9px] text-muted-foreground">
                {c.generated_by && getAdminLabel(c.generated_by) && (
                  <span>Generated by: <span className="font-bold text-foreground">{getAdminLabel(c.generated_by)}</span></span>
                )}
                {c.sent_to_name && (
                  <span>Sent to: <span className="font-bold text-primary">{c.sent_to_name}</span></span>
                )}
                {c.sent_at && (
                  <span>{new Date(c.sent_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
          {clubCodes.length === 0 && <p className="text-center text-[10px] text-muted-foreground py-2">No available codes</p>}
        </div>
      </div>
    </div>
  );
}
