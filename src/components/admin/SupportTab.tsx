"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, MessageSquare, Calendar, Search, Eye, CheckCircle2, AlertCircle, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SupportTab() {
  const [reports, setReports] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, chatsRes] = await Promise.all([
        (supabase as any).from("support_reports").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("support_chat_sessions").select("*").order("created_at", { ascending: false })
      ]);
      setReports(reportsRes.data || []);
      setChats(chatsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateReportStatus = async (id: string, status: string) => {
    try {
      await (supabase as any).from("support_reports").update({ status }).eq("id", id);
      toast.success(`Report marked as ${status}`);
      loadData();
    } catch (e) {
      toast.error("Failed to update report");
    }
  };

  const filteredReports = reports.filter(r => 
    r.incident_type.toLowerCase().includes(search.toLowerCase()) || 
    r.tracking_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Guidance Office</h2>
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-9 h-9 text-xs rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="reports" className="gap-2 text-xs">
            <ShieldAlert className="h-3.5 w-3.5" /> Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="chats" className="gap-2 text-xs">
            <MessageSquare className="h-3.5 w-3.5" /> Chats ({chats.length})
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-2 text-xs">
            <Calendar className="h-3.5 w-3.5" /> Appointments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filteredReports.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-12">No reports found.</p>
          ) : (
            filteredReports.map(report => (
              <div key={report.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-primary">{report.tracking_id}</span>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        report.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {report.severity}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold">{report.incident_type}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    report.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    {report.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{report.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold rounded-lg">
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                    {report.status !== 'resolved' && (
                      <Button 
                        onClick={() => updateReportStatus(report.id, 'resolved')}
                        size="sm" 
                        className="h-8 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="chats" className="space-y-3">
          {chats.map(chat => (
            <div key={chat.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold">{chat.concern_type}</p>
                  <p className="text-[10px] text-muted-foreground">Status: {chat.status}</p>
                </div>
              </div>
              <Button size="sm" className="h-8 text-[10px] font-bold rounded-lg">Open Chat</Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}