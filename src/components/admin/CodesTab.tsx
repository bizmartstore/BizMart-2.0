import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Copy, RefreshCw, Ticket, Store, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CodesTab() {
  const [clubCodes, setClubCodes] = useState<any[]>([]);
  const [sellerCodes, setSellerCodes] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [prefix, setPrefix] = useState("BIZCLUB");
  const [codeCount, setCodeCount] = useState(5);

  const loadCodes = useCallback(async () => {
    const { data: club } = await (supabase as any).from("club_codes").select("*").order("created_at", { ascending: false }).limit(50);
    setClubCodes(club || []);
    const { data: seller } = await (supabase as any).from("seller_codes").select("*").order("created_at", { ascending: false }).limit(50);
    setSellerCodes(seller || []);
  }, []);

  useEffect(() => { loadCodes(); }, [loadCodes]);

  const generateCodes = async (type: "club" | "seller") => {
    setGenerating(true);
    try {
      const codes = [];
      for (let i = 0; i < codeCount; i++) {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        codes.push({
          code: `${prefix}-${random}`,
          is_used: false,
        });
      }
      const table = type === "club" ? "club_codes" : "seller_codes";

      // Insert codes and fetch the inserted records
      const { data: insertedCodes, error } = await (supabase as any)
        .from(table)
        .insert(codes)
        .select(); // This ensures we get the inserted records with their IDs

      if (error) throw error;

      if (insertedCodes && insertedCodes.length > 0) {
        // Update the state with the newly inserted codes
        if (type === "club") {
          setClubCodes(prev => [...prev, ...insertedCodes]);
        } else {
          setSellerCodes(prev => [...prev, ...insertedCodes]);
        }
        toast.success(`Generated ${codeCount} ${type} codes!`);
      } else {
        toast.error("Failed to fetch generated codes.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate codes");
    }
    setGenerating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  return (
    <Tabs defaultValue="club">
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="club" className="gap-1"><ShieldCheck className="h-3 w-3 text-blue-500" /> Club Codes</TabsTrigger>
        <TabsTrigger value="seller" className="gap-1"><Store className="h-3 w-3 text-indigo-500" /> Seller Codes</TabsTrigger>
      </TabsList>

      <TabsContent value="club">
        <div className="space-y-3">
          <div className="bg-card rounded-xl p-3 border border-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Prefix</Label><Input value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())} className="text-xs h-8" /></div>
              <div><Label className="text-[10px]">Count</Label><Input type="number" value={codeCount} onChange={e => setCodeCount(Number(e.target.value))} className="text-xs h-8" /></div>
            </div>
            <Button onClick={() => generateCodes("club")} disabled={generating} size="sm" className="w-full gap-1">
              <Plus className="h-3 w-3" /> Generate Club Codes
            </Button>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {clubCodes.map(c => (
              <div key={c.id} className="bg-card rounded-lg p-2 border border-border flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold">{c.code}</span>
                  <span className={`text-[9px] ml-2 px-1.5 py-0.5 rounded-full ${c.is_used ? 'bg-muted text-muted-foreground' : 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'}`}>
                    {c.is_used ? "Used" : "Active"}
                  </span>
                </div>
                <button onClick={() => copyCode(c.code)} className="p-1 text-primary"><Copy className="h-3 w-3" /></button>
              </div>
            ))}
            {clubCodes.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No club codes yet</p>}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="seller">
        <div className="space-y-3">
          <div className="bg-card rounded-xl p-3 border border-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Prefix</Label><Input value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())} className="text-xs h-8" /></div>
              <div><Label className="text-[10px]">Count</Label><Input type="number" value={codeCount} onChange={e => setCodeCount(Number(e.target.value))} className="text-xs h-8" /></div>
            </div>
            <Button onClick={() => generateCodes("seller")} disabled={generating} size="sm" className="w-full gap-1">
              <Plus className="h-3 w-3" /> Generate Seller Codes
            </Button>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {sellerCodes.map(c => (
              <div key={c.id} className="bg-card rounded-lg p-2 border border-border flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold">{c.code}</span>
                  <span className={`text-[9px] ml-2 px-1.5 py-0.5 rounded-full ${c.is_used ? 'bg-muted text-muted-foreground' : 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]'}`}>
                    {c.is_used ? "Used" : "Active"}
                  </span>
                </div>
                <button onClick={() => copyCode(c.code)} className="p-1 text-primary"><Copy className="h-3 w-3" /></button>
              </div>
            ))}
            {sellerCodes.length === 0 && <p className="text-center text-xs text-muted-foreground py-6">No seller codes yet</p>}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}