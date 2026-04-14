import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Settings, BarChart3, HelpCircle, Shield, AlertTriangle, FileText, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

const GuidanceDashboard = () => {
  const { profile, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    if (isAuthReady && profile?.role !== "guidance") {
      navigate("/");
    } else if (isAuthReady) {
      setLoading(false);
      fetchReports();
      fetchMessages();
    }
  }, [isAuthReady, profile?.role, navigate]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("support_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data ?? []);
      setPendingReports((data ?? []).filter((r: any) => r.status?.toLowerCase() === "pending").length);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data);
      setUnreadCount(data.filter((m: any) => !m.is_read).length);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const markAsRead = async (reportId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("support_reports")
        .update({ status: "read" })
        .eq("id", reportId);

      if (error) throw error;
      fetchReports();
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  if (loading || !isAuthReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="mb-6">
          <h1 className="font-extrabold text-xl text-foreground">Guidance Dashboard</h1>
          <p className="text-xs text-muted-foreground">Welcome, Guidance Admin!</p>
        </div>

        <Tabs defaultValue="reports" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reports">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reports
              {pendingReports > 0 && <Badge variant="destructive" className="ml-2 text-xs">{pendingReports}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageCircle className="h-4 w-4 mr-2" />
              Messages
              {unreadCount > 0 && <Badge variant="default" className="ml-2 text-xs">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Support Reports</h2>
              <Button size="sm" onClick={() => navigate("/e-support/submit")}>
                <FileText className="h-4 w-4 mr-2" />
                Submit New Report
              </Button>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">No reports found</p>
                <p className="text-xs text-muted-foreground mt-2">Reports will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {reports.map((report) => (
                  <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    markAsRead(report.id);
                    navigate(`/e-support/track?id=${report.id}`);
                  }}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium truncate">{report.title || "Untitled Report"}</CardTitle>
                      <Badge variant={report.status === "pending" ? "destructive" : "default"}>
                        {report.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Messages</h2>
              <Button size="sm" onClick={() => navigate("/messages")}>
                <MessageCircle className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">No messages found</p>
                <p className="text-xs text-muted-foreground mt-2">Messages will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {messages.slice(0, 5).map((message) => (
                  <Card key={message.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium">{message.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin")}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Admin Panel</CardTitle>
                  <Shield className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Access admin features</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/")}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Home</CardTitle>
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Return to main page</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

export default GuidanceDashboard;
