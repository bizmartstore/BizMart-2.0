import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Store, CheckCircle2, XCircle, RefreshCw, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SellersTab() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sellerData } = await (supabase as any).from("seller_profiles").select("*, profiles(first_name, last_name, email)").order("created_at", { ascending: false });
    setSellers(sellerData || []);
    const { data: appData } = await (supabase as any).from("seller_applications").select("*, profiles(first_name, last_name, email)").order("created_at", { ascending: false });
    setApplications(appData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateApplication = async (id: string, status: string, notes: string = "") => {
    try {
      await (supabase as any).from("seller_applications").update({ status, admin_notes: notes }).eq("id", id);
      toast.success(`Application ${status}`);
      setSelectedApp(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const toggleSeller = async (id: string, active: boolean) => {
    await (supabase as any).from("seller_profiles").update({ is_active: !active }).eq("id", id);
    toast.success(`Seller ${!active ? "activated" : "deactivated"}`);
    load();
  };

  const filteredSellers = sellers.filter(s => 
    !search || (s.store_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredApps = applications.filter(a => 
    !search || (a.profiles?.first_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Tabs defaultValue="sellers">
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="sellers" className="gap-1"><Store className="h-3 w-3" /> Sellers</TabsTrigger>
        <TabsTrigger value="applications" className="gap-1"><Eye className="h-3 w-3" /> Applications</TabsTrigger>
      </TabsList>

      <TabsContent value="sellers">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sellers..." className="pl-9 text-xs h-9" />
            </div>
            <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3" /></Button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredSellers.map(s => (
              <div key={s.id} className="bg-card rounded-xl border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-accent overflow-hidden flex items-center justify-center">
                      {s.store_image ? <img src={s.store_image} className="w-full h-full object-cover" alt="" /> : <Store className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs">{s.store_name || "Unnamed Store"}</p>
                      <p className="text-[10px] text-muted-foreground">{s.profiles?.first_name} {s.profiles?.last_name}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.is_active ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'}`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {s.store_saying && <p className="text-[10px] text-primary italic mb-2">"{s.store_saying}"</p>}
                {s.location && <p className="text-[10px] text-muted-foreground mb-2">📍 {s.location}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant={s.is_active ? "destructive" : "default"} onClick={() => toggleSeller(s.id, s.is_active)} className="flex-1 text-[10px]">
                    {s.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
            {filteredSellers.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No sellers found</p>}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="applications">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applications..." className="pl-9 text-xs h-9" />
            </div>
            <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3" /></Button>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredApps.map(app => (
              <div key={app.id} className="bg-card rounded-xl border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-xs">{app.profiles?.first_name} {app.profiles?.last_name}</p>
                    <p className="text-[10px] text-muted-foreground">{app.business_type}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    app.status === 'approved' ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' :
                    app.status === 'pending' ? 'bg-warning/20 text-warning' :
                    'bg-destructive/20 text-destructive'
                  }`}>{app.status}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{app.reason}</p>
                {app.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateApplication(app.id, "approved")} className="gap-1 flex-1"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateApplication(app.id, "rejected")} className="gap-1 flex-1"><XCircle className="h-3 w-3" /> Reject</Button>
                  </div>
                )}
                {app.admin_notes && <p className="text-[10px] text-muted-foreground mt-2">Admin note: {app.admin_notes}</p>}
              </div>
            ))}
            {filteredApps.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground py-8">No applications found</p>}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}