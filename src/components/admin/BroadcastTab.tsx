import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Megaphone, Send, Clock, Sparkles, AlertCircle, History, Smartphone, Globe, Loader2, Save, Calendar, Trash2, Plus, X, Check, Clock as ClockIcon } from "lucide-react";

export default function BroadcastTab() {
  const [form, setForm] = useState({
    title: "",
    message: "",
    link: "/",
    icon: "📢"
  });
  const [isSending, setIsSending] = useState(false);
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [autoSendContent, setAutoSendContent] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState<any[]>([]);
  const [isLoadingScheduled, setIsLoadingScheduled] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    message: "",
    link: "/",
    icon: "📢",
    scheduleTime: "08:00:00"
  });
  const [isCreatingScheduled, setIsCreatingScheduled] = useState(false);
  const [isDeletingScheduled, setIsDeletingScheduled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
    loadHistory();
    loadScheduledBroadcasts();
  }, []);

  const loadSettings = async () => {
    const { data } = await (supabase as any).from("app_settings").select("*").eq("key", "daily_broadcast_config").maybeSingle();
    if (data?.value) {
      setAutoSendEnabled(data.value.enabled || false);
      setAutoSendContent(data.value.message || "");
    }
  };

  const loadHistory = async () => {
    const { data } = await (supabase as any)
      .from("notification_logs")
      .select("*")
      .eq("type", "broadcast")
      .order("created_at", { ascending: false })
      .limit(5);
    setHistory(data || []);
  };

  const loadScheduledBroadcasts = async () => {
    setIsLoadingScheduled(true);
    try {
      const { data } = await (supabase as any)
        .from("scheduled_broadcasts")
        .select("*")
        .order("schedule_time", { ascending: true });
      setScheduledBroadcasts(data || []);
    } catch (e: any) {
      toast.error("Failed to load scheduled broadcasts: " + e.message);
    } finally {
      setIsLoadingScheduled(false);
    }
  };

  const createScheduledBroadcast = async () => {
    if (!scheduleForm.title || !scheduleForm.message) {
      toast.error("Title and Message are required!");
      return;
    }

    setIsCreatingScheduled(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const scheduleTime = scheduleForm.scheduleTime;
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const today = new Date();
      const scheduledDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes,
        0,
        0
      );

      // Ensure the scheduled time is in the future
      if (scheduledDate <= today) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      const payload = {
        ...scheduleForm,
        created_by: user.id,
        status: "pending",
        schedule_time: scheduledDate.toISOString()
      };

      const { error } = await (supabase as any)
        .from("scheduled_broadcasts")
        .insert(payload);

      if (error) throw error;

      toast.success("Scheduled broadcast created successfully!");
      setScheduleForm({
        title: "",
        message: "",
        link: "/",
        icon: "📢",
        scheduleTime: "08:00:00"
      });
      setShowScheduleForm(false);
      loadScheduledBroadcasts();
    } catch (e: any) {
      console.error("Failed to create scheduled broadcast:", e);
      toast.error("Failed to create scheduled broadcast: " + e.message);
    } finally {
      setIsCreatingScheduled(false);
    }
  };

  const deleteScheduledBroadcast = async (id: string) => {
    setIsDeletingScheduled(prev => ({ ...prev, [id]: true }));
    try {
      const { error } = await (supabase as any)
        .from("scheduled_broadcasts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Scheduled broadcast deleted!");
      loadScheduledBroadcasts();
    } catch (e: any) {
      toast.error("Failed to delete scheduled broadcast: " + e.message);
    } finally {
      setIsDeletingScheduled(prev => ({ ...prev, [id]: false }));
    }
  };

  const saveAutoSettings = async () => {
    setIsSavingSettings(true);
    try {
      const payload = { enabled: autoSendEnabled, message: autoSendContent };
      const { data: existing } = await (supabase as any).from("app_settings").select("id").eq("key", "daily_broadcast_config").maybeSingle();

      if (existing) {
        await (supabase as any).from("app_settings").update({ value: payload }).eq("key", "daily_broadcast_config");
      } else {
        await (supabase as any).from("app_settings").insert({ key: "daily_broadcast_config", value: payload });
      }
      toast.success("Auto-broadcast settings updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!form.title || !form.message) {
      toast.error("Title and Message are required!");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("broadcast-push", {
        body: form
      });

      if (error) throw error;

      toast.success(`Broadcast sent successfully to ${data.sent} customers!`);
      setForm({ title: "", message: "", link: "/", icon: "📢" });
      loadHistory();
    } catch (e: any) {
      toast.error("Failed to send broadcast: " + e.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Rich Composer */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary/5 px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Megaphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Announcement Composer</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Push to all customers</p>
            </div>
          </div>
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Globe className="h-3 w-3" /> Live
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Label className="text-xs font-bold mb-1.5 block">Notification Title</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 📢 Flash Sale Alert!"
                className="rounded-xl h-11"
              />
            </div>
            <div>
              <Label className="text-xs font-bold mb-1.5 block">Icon</Label>
              <Input
                value={form.icon}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="Emoji"
                className="rounded-xl h-11 text-center text-lg"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold mb-1.5 block">Announcement Message</Label>
            <Textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="What do you want to tell your students?"
              className="rounded-xl min-h-[100px] resize-none"
            />
          </div>

          <div>
            <Label className="text-xs font-bold mb-1.5 block">Destination Link (Optional)</Label>
            <Input
              value={form.link}
              onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
              placeholder="/"
              className="rounded-xl h-11"
            />
          </div>

          <Button
            onClick={handleSendBroadcast}
            disabled={isSending}
            className="w-full h-12 rounded-xl font-extrabold gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {isSending ? "Dispatching..." : "Send to All Customers"}
          </Button>
        </div>
      </div>

      {/* Scheduled Broadcasts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-bold text-sm">Scheduled Broadcasts</h4>
              <p className="text-[10px] text-muted-foreground">Set up automated broadcasts at specific times</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="gap-2 rounded-lg text-xs font-bold"
          >
            {showScheduleForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            {showScheduleForm ? "Cancel" : "Add New Scheduled Broadcast"}
          </Button>
        </div>

        {showScheduleForm && (
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Label className="text-xs font-bold mb-1.5 block">Title</Label>
                <Input
                  value={scheduleForm.title}
                  onChange={e => setScheduleForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Morning Announcement"
                  className="rounded-xl h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold mb-1.5 block">Icon</Label>
                <Input
                  value={scheduleForm.icon}
                  onChange={e => setScheduleForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="Emoji"
                  className="rounded-xl h-10 text-sm text-center text-lg"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Message</Label>
              <Textarea
                value={scheduleForm.message}
                onChange={e => setScheduleForm(f => ({ ...f, message: e.target.value }))}
                placeholder="What do you want to announce?"
                className="bg-background text-sm rounded-xl min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold mb-1.5 block">Link (Optional)</Label>
                <Input
                  value={scheduleForm.link}
                  onChange={e => setScheduleForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="/"
                  className="rounded-xl h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-bold mb-1.5 block">Time</Label>
                <Input
                  type="time"
                  value={scheduleForm.scheduleTime}
                  onChange={e => setScheduleForm(f => ({ ...f, scheduleTime: e.target.value }))}
                  className="rounded-xl h-10 text-sm"
                />
              </div>
            </div>

            <Button
              onClick={createScheduledBroadcast}
              disabled={isCreatingScheduled}
              className="w-full h-10 rounded-xl font-extrabold gap-2 text-sm"
            >
              {isCreatingScheduled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isCreatingScheduled ? "Creating..." : "Create Scheduled Broadcast"}
            </Button>
          </div>
        )}

        {/* Scheduled Broadcasts List */}
        <div className="space-y-3">
          {isLoadingScheduled ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : scheduledBroadcasts.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground italic bg-card rounded-xl border border-border">
              No scheduled broadcasts yet
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledBroadcasts.map((broadcast) => (
                <div key={broadcast.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{broadcast.icon || "📢"}</span>
                      <p className="text-xs font-bold text-foreground truncate">{broadcast.title}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{broadcast.message}</p>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="font-bold text-primary">
                        <ClockIcon className="h-3 w-3 inline-block mr-1" />
                        {new Date(broadcast.schedule_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="font-bold text-muted-foreground uppercase">Status: {broadcast.status}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteScheduledBroadcast(broadcast.id)}
                    disabled={isDeletingScheduled[broadcast.id]}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isDeletingScheduled[broadcast.id] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auto-Trigger Section */}
      <div className="bg-muted/30 rounded-2xl border border-border p-6 border-dashed">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-bold text-sm">1-Day Auto-Trigger</h4>
              <p className="text-[10px] text-muted-foreground">Automated daily school opening reminder</p>
            </div>
          </div>
          <Switch checked={autoSendEnabled} onCheckedChange={setAutoSendEnabled} />
        </div>

        <div className="space-y-3">
          <Textarea
            value={autoSendContent}
            onChange={e => setAutoSendContent(e.target.value)}
            placeholder="e.g. Good morning! BizMart is now OPEN for orders. Happy shopping! 🛍️"
            className="bg-background text-sm rounded-xl"
            disabled={!autoSendEnabled}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={saveAutoSettings}
            disabled={isSavingSettings}
            className="w-full gap-2 rounded-lg text-xs font-bold"
          >
            {isSavingSettings ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save Automation Settings
          </Button>
        </div>
        <div className="mt-3 flex items-start gap-2 bg-primary/5 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-primary/80 font-medium leading-relaxed">
            Note: When enabled, this message will be queued for daily delivery to all students at school opening (8:00 AM).
          </p>
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recent Broadcasts</h4>
        </div>
        <div className="space-y-2">
          {history.map((log) => (
            <div key={log.id} className="bg-card border border-border p-3 rounded-xl flex items-start gap-3">
              <span className="text-2xl mt-1">{log.icon || "📢"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{log.title}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{log.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(log.created_at).toLocaleString()}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[8px] font-bold text-primary uppercase">Link: {log.link}</span>
                </div>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-center py-6 text-xs text-muted-foreground italic">No broadcast history yet</p>
          )}
        </div>
      </div>
    </div>
  );
}