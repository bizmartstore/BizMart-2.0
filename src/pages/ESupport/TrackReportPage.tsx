"use client";

import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Eye, Search, Loader2, CheckCircle2, Clock, XCircle, AlertTriangle, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { getOrCreateChatSession, sendSupportMessage } from "@/lib/supportChat";

export default function TrackReportPage() {
  const navigate = useNavigate();
  const { toast: sonnerToast } = useToast();
  const { user, profile } = useAuth();
  const { isGuidance } = useAdmin();
  const [trackingId, setTrackingId] = useState("");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Check for tracking ID in URL query params on initial load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get("id");
    if (idParam && !trackingId) {
      setTrackingId(idParam);
      handleSearchById(idParam);
    }
  }, []);

  const handleSearchById = async (id: string) => {
    if (!id.trim()) {
      sonnerToast({
        title: "Error",
        description: "Please enter a tracking ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSearchAttempted(true);

    try {
      // Search for the report in the database
      const { data, error } = await (supabase as any)
        .from("support_reports")
        .select("*")
        .eq("tracking_id", id.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setReport(data);
      } else {
        setError("Report not found. Please check your tracking ID and try again.");
        sonnerToast({
          title: "Report not found",
          description: "Please check your tracking ID and try again.",
          variant: "destructive",
        });
      }

    } catch (err: any) {
      console.error("Failed to fetch report:", err);
      setError("Failed to fetch report. Please try again later.");
      sonnerToast({
        title: "Error",
        description: "Failed to fetch report. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await handleSearchById(trackingId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "investigating":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "resolved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "escalated":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Pending Review";
      case "investigating": return "Under Investigation";
      case "resolved": return "Resolved";
      case "escalated": return "Escalated to Admin";
      case "rejected": return "Rejected";
      default: return status;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "high": return "text-orange-600 bg-orange-100";
      case "critical": return "text-red-600 bg-red-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  const handleSendMessage = async () => {
    if (!report || !user || !message.trim()) {
      sonnerToast({
        title: "Error",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    setSessionError(null);

    try {
      // Create or get chat session
      const sessionId = await getOrCreateChatSession(report.id);

      // Send the message
      const newMessage = await sendSupportMessage(sessionId, user.id, message);

      // Clear the message and show success
      setMessage("");
      sonnerToast({
        title: "Message Sent!",
        description: "Your message has been sent to the reporter.",
      });

      // Refresh the report to show any status changes
      await handleSearchById(report.tracking_id);

    } catch (err: any) {
      console.error("Failed to send message:", err);
      setSessionError(err.message || "Failed to send message. Please try again.");
      sonnerToast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <Eye className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Track Report</h1>
            <p className="text-xs text-muted-foreground">Check the status of your confidential report</p>
          </div>
        </div>

        {/* Search Form */}
        <Card className="border border-border shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Enter Your Tracking ID</CardTitle>
            <CardDescription>
              Find the status of your confidential report using the tracking ID provided when you submitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                placeholder="REP-XXXX-XXXX"
                className="flex-1 h-10 rounded-xl font-mono text-sm"
              />
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-10 font-bold rounded-xl gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Status */}
        {searchAttempted && !loading && !report && !error && (
          <Card className="border border-border shadow-lg">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">No Report Found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Please check your tracking ID and try again.
              </p>
              <Button
                onClick={() => {
                  setTrackingId("");
                  setReport(null);
                  setError(null);
                  setSearchAttempted(false);
                }}
                variant="outline"
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {report && (
          <Card className="border border-border shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                {getStatusIcon(report.status)}
                <CardTitle className="text-sm font-bold">
                  {getStatusText(report.status)}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tracking ID */}
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Tracking ID</p>
                <p className="text-sm font-mono font-bold text-foreground">{report.tracking_id}</p>
              </div>

              {/* Report Type */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Report Type</p>
                <p className="text-sm font-bold capitalize">
                  {report.incident_type?.replace("_", " ")}
                </p>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Title</p>
                <p className="text-sm font-bold">{report.title}</p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</p>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>

              {/* Location */}
              {report.location && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Location</p>
                  <p className="text-sm">{report.location}</p>
                </div>
              )}

              {/* Date and Time */}
              {(report.incident_date || report.time) && (
                <div className="grid grid-cols-2 gap-3">
                  {report.incident_date && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</p>
                      <p className="text-sm">{report.incident_date}</p>
                    </div>
                  )}
                  {report.time && (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</p>
                      <p className="text-sm">{report.time}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Severity */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Severity</p>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getSeverityColor(report.severity)}`}>
                  {report.severity?.toUpperCase()}
                </span>
              </div>

              {/* Status History */}
              <div className="space-y-2 mt-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Status History</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div>
                      <p className="text-xs font-bold">{getStatusText(report.status)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Section - Only for guidance admins */}
              {isGuidance && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Message Reporter</p>

                    {/* Error Alert */}
                    {sessionError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{sessionError}</AlertDescription>
                      </Alert>
                    )}

                    <textarea
                      placeholder="Type your message to the reporter..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-3 border border-border rounded-lg min-h-[100px] bg-background text-sm"
                      id="guidanceMessage"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !message.trim()}
                      className="gap-2"
                    >
                      {sendingMessage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4" />
                          Send Message to Reporter
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Not Found */}
        {error && (
          <Card className="border border-border shadow-lg">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Report Not Found</h3>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Button
                onClick={() => {
                  setTrackingId("");
                  setReport(null);
                  setError(null);
                  setSearchAttempted(false);
                }}
                variant="outline"
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Report Searched */}
        {!searchAttempted && !report && !error && (
          <Card className="border border-border shadow-lg">
            <CardContent className="py-12 text-center">
              <Eye className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Track Your Report</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your tracking ID to check the status of your confidential report.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                You can find your tracking ID in the confirmation email or on the submission page.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Toaster />
      <BottomNav />
    </div>
  );
}