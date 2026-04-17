"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserPlus, Calendar, Wallet, Megaphone, Settings, Crown, ArrowLeft, UserCog, Plus, Edit, Trash2, Coins, CreditCard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Organization, Member, Event, Transaction, Announcement } from "@/types";

export default function OrganizationDashboard() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<'creator' | 'officer' | 'member' | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  // Form states
  const [newEventForm, setNewEventForm] = useState({
    name: "",
    description: "",
    deadline: "",
    capacity: 10,
    fee: 0,
  });

  const [depositForm, setDepositForm] = useState({
    amount: "",
    purpose: "",
    reference: "",
  });

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    purpose: "",
    recipient: "",
  });

  const [newAnnouncementForm, setNewAnnouncementForm] = useState({
    title: "",
    content: "",
  });

  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchOrganizationData();
      checkMembership();
    }
  }, [user, id]);

  const fetchOrganizationData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();

      if (orgError) throw orgError;
      if (!orgData) throw new Error("Organization not found");

      setOrganization(orgData);

      // Fetch member count
      const { count } = await supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", id);

      setOrganization({ ...(orgData as Organization), member_count: count || 0 });

      // Fetch wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from("organization_wallets")
        .select("balance")
        .eq("organization_id", id)
        .single();

      if (walletError) {
        // Create wallet if it doesn't exist
        await (supabase.from("organization_wallets") as any).insert({
            organization_id: id,
            balance: 0,
          });
        setWalletBalance(0);
      } else if (walletData) {
        setWalletBalance((walletData as { balance: number }).balance);
      }

      // Fetch members
      const { data: membersData } = await supabase
        .from("organization_members")
        .select(`*, profiles(first_name, last_name, email, avatar_url)`)
        .eq("organization_id", id)
        .eq("status", "active")
        .order("role", { ascending: false })
        .order("joined_at", { ascending: false });

      setMembers(membersData || []);

      // Fetch events
      const { data: eventsData } = await supabase
        .from("organization_events")
        .select("*")
        .eq("organization_id", id)
        .order("created_at", { ascending: false });

      setEvents(eventsData || []);

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("organization_transactions")
        .select(`*, profiles(first_name, last_name, avatar_url)`)
        .eq("organization_id", id)
        .order("created_at", { ascending: false });

      if (transactionsError) console.error("Error fetching transactions:", transactionsError);
      setTransactions(transactionsData || []);

      // Fetch announcements
      const { data: announcementsData, error: announcementsError } = await supabase
        .from("organization_announcements")
        .select(`*, profiles:profiles!organization_announcements_created_by_fkey(first_name, last_name, avatar_url)`)
        .eq("organization_id", id)
        .order("created_at", { ascending: false });

      if (announcementsError) console.error("Error fetching announcements:", announcementsError);
      setAnnouncements(announcementsData || []);

      // Check if user is a member and get their role
      if (user) {
        const { data: memberData, error: memberError } = await supabase
          .from("organization_members")
          .select("role")
          .eq("organization_id", id)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (memberError) console.error("Error fetching member data:", memberError);
        if (memberData) {
          setIsMember(true);
          setUserRole(memberData.role);
        }
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
      toast.error("Failed to load organization data");
      navigate("/organizations");
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, user]);

  const checkMembership = async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (error) console.error("Error checking membership:", error);
    if (data) {
      setIsMember(true);
      setUserRole(data.role);
    }
  };

  const handleJoinOrganization = async () => {
    if (!user || !organization) return;

    try {
      await (supabase.from("organization_members") as any).insert({
        organization_id: (organization as any).id,
        user_id: user.id,
        role: "member",
      });

      toast.success(`Successfully joined ${organization.name}!`);
      setIsMember(true);
      setUserRole("member");
      fetchOrganizationData();
      setIsJoinDialogOpen(false);
    } catch (error) {
      console.error("Error joining organization:", error);
      toast.error("Failed to join organization");
    }
  };

  const handleCreateEvent = async () => {
    if (!organization || !user) return;

    try {
      const { error } = await (supabase.from("organization_events") as any).insert({
        organization_id: (organization as any).id,
        name: newEventForm.name,
        description: newEventForm.description,
        deadline: newEventForm.deadline,
        capacity: newEventForm.capacity,
        fee: newEventForm.fee,
        status: "upcoming",
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Event created successfully!");
      fetchOrganizationData();
      setNewEventForm({
        name: "",
        description: "",
        deadline: "",
        capacity: 10,
        fee: 0,
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    }
  };

  const handleCreateDeposit = async () => {
    if (!organization || !user) return;

    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const { error } = await (supabase.from("organization_transactions") as any).insert({
        organization_id: (organization as any).id,
        user_id: user.id,
        type: "deposit",
        amount,
        status: "pending",
        purpose: depositForm.purpose,
        reference: depositForm.reference,
        gcash_fee: 0,
      });

      if (error) throw error;

      toast.success("Deposit request submitted for admin approval!");
      fetchOrganizationData();
      setDepositForm({
        amount: "",
        purpose: "",
        reference: "",
      });
    } catch (error) {
      console.error("Error creating deposit:", error);
      toast.error("Failed to submit deposit request");
    }
  };

  const handleCreateWithdrawal = async () => {
    if (!organization || !user) return;

    const amount = parseFloat(withdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const { error } = await (supabase.from("organization_transactions") as any).insert({
        organization_id: (organization as any).id,
        user_id: user.id,
        type: "withdrawal",
        amount,
        status: "pending",
        purpose: withdrawalForm.purpose,
        reference: withdrawalForm.recipient,
        gcash_fee: 0,
      });

      if (error) throw error;

      toast.success("Withdrawal request submitted for admin approval!");
      fetchOrganizationData();
      setWithdrawalForm({
        amount: "",
        purpose: "",
        recipient: "",
      });
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      toast.error("Failed to submit withdrawal request");
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!organization || !user) return;

    try {
      const { error } = await (supabase.from("organization_announcements") as any).insert({
        organization_id: (organization as any).id,
        title: newAnnouncementForm.title,
        content: newAnnouncementForm.content,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Announcement created successfully!");
      fetchOrganizationData();
      setNewAnnouncementForm({
        title: "",
        content: "",
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Failed to create announcement");
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !organization) return;

    try {
      await (supabase
        .from("organization_members") as any)
        .update({ status: "left" })
        .eq("id", memberToRemove as string);

      toast.success("Member removed successfully!");
      fetchOrganizationData();
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      await supabase.from("organization_events").delete().eq("id", eventToDelete);

      toast.success("Event deleted successfully!");
      fetchOrganizationData();
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const canManageMembers = userRole === "creator" || userRole === "officer";
  const isNotMember = userRole !== "member";
  const canManageEvents = userRole === "creator" || userRole === "officer";
  const canManageWallet = userRole === "creator" || userRole === "officer";
  const canCreateAnnouncements = userRole === "creator" || userRole === "officer";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/organizations")} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Organizations
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-extrabold text-xl text-foreground flex items-center gap-2">
                <Crown className="h-5 w-5" /> {organization.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {organization.club_type} • {organization.member_count || 0} members
              </p>
            </div>
            {!isMember ? (
              <Button onClick={() => setIsJoinDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" /> Join Organization
              </Button>
            ) : (
              <Badge variant={userRole === "creator" ? "default" : userRole === "officer" ? "secondary" : "outline"}>
                {userRole === "creator" ? "Creator" : userRole === "officer" ? "Officer" : "Member"}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="flex flex-col items-center gap-1 text-[10px] font-medium">
              <span className="text-lg">📊</span>
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex flex-col items-center gap-1 text-[10px] font-medium">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex flex-col items-center gap-1 text-[10px] font-medium">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex flex-col items-center gap-1 text-[10px] font-medium">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex flex-col items-center gap-1 text-[10px] font-medium">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Organization Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{organization.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge variant="outline">{organization.club_type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={organization.status === "approved" ? "default" : organization.status === "pending" ? "secondary" : "destructive"}>
                        {organization.status}
                      </Badge>
                    </div>
                    {organization.adviser_name && (
                      <div className="flex justify-between">
                        <span>Adviser:</span>
                        <span>{organization.adviser_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(organization.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Recent Announcements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-40 overflow-y-auto">
                  {announcements.slice(0, 3).map((announcement) => (
                    <div key={announcement.id} className="border-b pb-2 last:border-0">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && <p className="text-xs text-muted-foreground">No announcements yet</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-40 overflow-y-auto">
                  {events
                    .filter((event) => event.status === "upcoming")
                    .slice(0, 3)
                    .map((event) => (
                      <div key={event.id} className="border-b pb-2 last:border-0">
                        <h4 className="font-medium text-sm">{event.name}</h4>
                        <p className="text-xs text-muted-foreground">Deadline: {event.deadline ? new Date(event.deadline).toLocaleDateString() : "N/A"}</p>
                      </div>
                    ))}
                  {events.filter((event) => event.status === "upcoming").length === 0 && <p className="text-xs text-muted-foreground">No upcoming events</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Members ({members.length})</CardTitle>
                  {canManageMembers && (
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" /> Invite Member
                    </Button>
                  )}
                </div>
                <CardDescription>Manage organization members and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No members yet</p>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.profile?.first_name?.charAt(0) || "U"}{member.profile?.last_name?.charAt(0) || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {member.profile?.first_name} {member.profile?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.profile?.email}</p>
                            <Badge variant={member.role === "creator" ? "default" : member.role === "officer" ? "secondary" : "outline"} className="mt-1">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                        {canManageMembers && isNotMember && member.role !== "creator" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMemberToRemove(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Events</h2>
              {canManageEvents && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Create Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="event-name">Event Name *</Label>
                        <Input
                          id="event-name"
                          value={newEventForm.name}
                          onChange={(e) => setNewEventForm({ ...newEventForm, name: e.target.value })}
                          placeholder="e.g., Annual Tech Conference"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-description">Description *</Label>
                        <Textarea
                          id="event-description"
                          value={newEventForm.description}
                          onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                          placeholder="Brief description of the event"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-deadline">Registration Deadline</Label>
                        <Input
                          id="event-deadline"
                          type="date"
                          value={newEventForm.deadline}
                          onChange={(e) => setNewEventForm({ ...newEventForm, deadline: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="event-capacity">Capacity</Label>
                          <Input
                            id="event-capacity"
                            type="number"
                            value={newEventForm.capacity}
                            onChange={(e) => setNewEventForm({ ...newEventForm, capacity: parseInt(e.target.value) || 0 })}
                            min="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="event-fee">Fee (₱)</Label>
                          <Input
                            id="event-fee"
                            type="number"
                            value={newEventForm.fee}
                            onChange={(e) => setNewEventForm({ ...newEventForm, fee: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <Button onClick={handleCreateEvent} className="w-full">
                        Create Event
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <CardDescription>
                          {event.status === "upcoming" ? "Upcoming" : event.status === "ongoing" ? "Ongoing" : "Completed"}
                        </CardDescription>
                      </div>
                      {canManageEvents && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEventToDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Deadline: {event.deadline ? new Date(event.deadline).toLocaleDateString() : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Capacity: {event.capacity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        <span>Fee: ₱{event.fee.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Status: {event.status}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && <p className="text-muted-foreground text-sm">No events yet</p>}
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization Wallet</CardTitle>
                <CardDescription>Manage your organization's funds</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-5xl font-bold text-primary mb-2">₱{walletBalance.toFixed(2)}</div>
                  <p className="text-muted-foreground">Current Balance</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2" variant="outline">
                        <CreditCard className="h-4 w-4" /> Make a Deposit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Deposit Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="deposit-amount">Amount (₱) *</Label>
                          <Input
                            id="deposit-amount"
                            type="number"
                            value={depositForm.amount}
                            onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                            min="1"
                            step="0.01"
                            placeholder="e.g., 500.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deposit-purpose">Purpose *</Label>
                          <Input
                            id="deposit-purpose"
                            value={depositForm.purpose}
                            onChange={(e) => setDepositForm({ ...depositForm, purpose: e.target.value })}
                            placeholder="e.g., Membership fees, Event funds"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deposit-reference">Reference (Optional)</Label>
                          <Input
                            id="deposit-reference"
                            value={depositForm.reference}
                            onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })}
                            placeholder="e.g., Bank transfer reference"
                          />
                        </div>
                        <Button onClick={handleCreateDeposit} className="w-full">
                          Submit Deposit Request
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2" variant="outline">
                        <CreditCard className="h-4 w-4" /> Request Withdrawal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit Withdrawal Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="withdrawal-amount">Amount (₱) *</Label>
                          <Input
                            id="withdrawal-amount"
                            type="number"
                            value={withdrawalForm.amount}
                            onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                            min="1"
                            step="0.01"
                            placeholder="e.g., 200.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="withdrawal-purpose">Purpose *</Label>
                          <Input
                            id="withdrawal-purpose"
                            value={withdrawalForm.purpose}
                            onChange={(e) => setWithdrawalForm({ ...withdrawalForm, purpose: e.target.value })}
                            placeholder="e.g., Event expenses, Supplies"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="withdrawal-recipient">Recipient *</Label>
                          <Input
                            id="withdrawal-recipient"
                            value={withdrawalForm.recipient}
                            onChange={(e) => setWithdrawalForm({ ...withdrawalForm, recipient: e.target.value })}
                            placeholder="e.g., GCash number or bank account"
                          />
                        </div>
                        <Button onClick={handleCreateWithdrawal} className="w-full">
                          Submit Withdrawal Request
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Transaction History</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${transaction.type === "deposit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {transaction.type === "deposit" ? <CreditCard className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.type === "deposit" ? "Deposit" : "Withdrawal"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.purpose} • {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${transaction.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                            {transaction.type === "deposit" ? "+₱" : "-₱"}{transaction.amount.toFixed(2)}
                          </p>
                          <Badge variant={transaction.status === "pending" ? "secondary" : transaction.status === "approved" ? "default" : "destructive"} className="mt-1">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && <p className="text-xs text-muted-foreground">No transactions yet</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Announcements</h2>
              {canCreateAnnouncements && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Create Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="announcement-title">Title *</Label>
                        <Input
                          id="announcement-title"
                          value={newAnnouncementForm.title}
                          onChange={(e) => setNewAnnouncementForm({ ...newAnnouncementForm, title: e.target.value })}
                          placeholder="e.g., Upcoming Event"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="announcement-content">Content *</Label>
                        <Textarea
                          id="announcement-content"
                          value={newAnnouncementForm.content}
                          onChange={(e) => setNewAnnouncementForm({ ...newAnnouncementForm, content: e.target.value })}
                          placeholder="Announcement details"
                          rows={4}
                        />
                      </div>
                      <Button onClick={handleCreateAnnouncement} className="w-full">
                        Post Announcement
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <CardDescription className="text-xs">
                          Posted by: {announcement.profile?.first_name} {announcement.profile?.last_name} • {new Date(announcement.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))}
              {announcements.length === 0 && <p className="text-muted-foreground text-sm">No announcements yet</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the organization?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive hover:bg-destructive/90">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Event Confirmation */}
      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive hover:bg-destructive/90">
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Join Organization Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {organization.name}</DialogTitle>
            <DialogDescription>
              Are you sure you want to join this organization?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm"><strong>Type:</strong> {organization.club_type}</p>
            <p className="text-sm"><strong>Description:</strong> {organization.description}</p>
            <p className="text-sm"><strong>Adviser:</strong> {organization.adviser_name || "N/A"}</p>
            <Button onClick={handleJoinOrganization} className="w-full">
              Confirm Join
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
