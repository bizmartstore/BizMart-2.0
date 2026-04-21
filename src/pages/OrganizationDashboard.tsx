"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, UserPlus, Calendar, Wallet, Megaphone, Settings, Crown, ArrowLeft, UserCog, Plus, Edit, Trash2, Coins, CreditCard, DollarSign, AlertCircle, X, MessageCircle, Check } from "lucide-react";
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
import JoinOrganizationInstructionDialog from "@/components/JoinOrganizationInstructionDialog";
import { Organization, Member, Event, Transaction, Announcement, EventJoinRequest } from "@/types";

// Add these type definitions after your imports
interface OrganizationMemberInsert {
  organization_id: string;
  user_id: string;
  role: "creator" | "officer" | "member";
}

interface EventInsert {
  organization_id: string;
  name: string;
  description: string;
  deadline: string;
  capacity: number;
  fee: number;
  status: string;
  created_by: string;
}

interface TransactionInsert {
  organization_id: string;
  user_id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: string;
  purpose: string;
  reference: string;
  gcash_fee: number;
}

interface AnnouncementInsert {
  organization_id: string;
  title: string;
  content: string;
  created_by: string;
}


export default function OrganizationDashboard() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventJoinRequests, setEventJoinRequests] = useState<EventJoinRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<'creator' | 'officer' | 'member' | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [pendingJoinRequest, setPendingJoinRequest] = useState(false);
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
  const [orgBackgroundImage, setOrgBackgroundImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [backgroundTextColor, setBackgroundTextColor] = useState<string>("text-white");

  // Function to calculate text color based on background brightness
  const calculateTextColor = (imageUrl: string) => {
    // Create a temporary canvas to calculate brightness
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      canvas.width = 100;
      canvas.height = 100;
      ctx?.drawImage(img, 0, 0, 100, 100);
      
      // Get pixel data
      const imageData = ctx?.getImageData(0, 0, 100, 100).data;
      if (imageData) {
        let brightness = 0;
        let pixels = 0;
        
        // Calculate average brightness
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          brightness += (r * 299 + g * 587 + b * 114) / 1000;
          pixels++;
        }
        
        brightness = brightness / pixels;
        
        // Set text color based on brightness
        if (brightness > 128) {
          setBackgroundTextColor("text-black");
        } else {
          setBackgroundTextColor("text-white");
        }
      }
    };
    
    img.onerror = () => {
      // If image fails to load, default to white text
      setBackgroundTextColor("text-white");
    };
  };

  const checkPendingJoinRequest = useCallback(async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;

      setPendingJoinRequest(!!data);
    } catch (error) {
      console.error("Error checking pending join request:", error);
    }
  }, [id, user]);

  // Form states
  const [newEventForm, setNewEventForm] = useState({
    name: "",
    description: "",
    deadline: "",
    capacity: 10,
    fee: 0,
  });

  const [newAnnouncementForm, setNewAnnouncementForm] = useState({
    title: "",
    content: "",
  });

  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [eventJoinRequestToApprove, setEventJoinRequestToApprove] = useState<string | null>(null);
  const [eventJoinRequestToReject, setEventJoinRequestToReject] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchOrganizationData();
      checkPendingJoinRequest();
    }
  }, [user, id, checkPendingJoinRequest]);

  const fetchOrganizationData = useCallback(async () => {
  try {
    setIsLoading(true);
    
    if (!id) {
      throw new Error("Organization ID is missing");
    }

    // 1. Organization data
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .eq("status", "approved")
      .single();

    if (orgError) {
      console.error("Organization fetch error:", orgError);
      throw orgError;
    }
    if (!orgData) {
      console.error("Organization not found for ID:", id);
      throw new Error("Organization not found or not approved");
    }

    // 2. Member count
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", id);

    setOrganization({
      ...(orgData as Organization),
      member_count: count || 0,
    });

    // 3. Wallet
const { data: walletData, error: walletError } = await supabase
  .from("organization_wallets")
  .select("*")
  .eq("organization_id", id)
  .maybeSingle();

if (walletError) throw walletError;

if (!walletData) {
  await (supabase.from("organization_wallets") as any).insert([
    { organization_id: id!, balance: 0 }
  ]);
  setWalletBalance(0);
} else {
  setWalletBalance((walletData as { balance: number }).balance ?? 0);
}

    // 4. Members with profiles data
    const { data: membersData } = await supabase
      .from("organization_members")
      .select(`*, profiles:user_id(first_name, last_name, email, avatar_url)`)
      .eq("organization_id", id)
      .eq("status", "active")
      .order("role", { ascending: false })
      .order("joined_at", { ascending: false });

    setMembers((membersData || []).map(m => ({
  ...m,
  role: m.role as "member" | "creator" | "officer"
})) as Member[]);

    // 5. Events
    const { data: eventsData } = await supabase
      .from("organization_events")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    setEvents((eventsData || []).map(e => ({
      ...e,
      status: e.status as "upcoming" | "ongoing" | "completed",
      requires_payment: e.requires_payment || false,
      payment_instructions: e.payment_instructions || undefined,
    })) as Event[]);

    // 5.1 Event Join Requests (for creators and officers)
    if (canManageEvents) {
      const { data: joinRequestsData } = await supabase
        .from("event_join_requests")
        .select(`*, profiles:user_id(first_name, last_name, email, avatar_url), events:event_id(name, fee, requires_payment)`)
        .eq("organization_id", id)
        .order("created_at", { ascending: false });

      setEventJoinRequests((joinRequestsData || []).map(req => ({
        ...req,
        status: req.status as "pending" | "approved" | "rejected",
      })) as EventJoinRequest[]);
    }

    // 6. Wallet transactions
    const { data: walletTransactionsData, error: walletTransactionsError } = await supabase
      .from("organization_transactions")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    if (walletTransactionsError) {
      console.error("Error fetching wallet transactions:", walletTransactionsError);
    }

    setTransactions((walletTransactionsData || []).map(t => ({
  ...t,
  type: t.type as "deposit" | "withdrawal"
})) as Transaction[]);

    // 7. Announcements
    const { data: announcementsData, error: announcementsError } = await supabase
      .from("organization_announcements")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false });

    if (announcementsError) {
      console.error("Error fetching announcements:", announcementsError);
    }

    setAnnouncements(announcementsData || []);

    // 8. Membership check
      if (user && id) {
        const { data, error } = await supabase
          .from("organization_members")
          .select("role, status")
          .eq("organization_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
  
        if (error) {
          console.error("Error fetching member data:", error);
        }
  
        const memberData = data as { role?: "creator" | "officer" | "member"; status?: string } | null;
  
        if (memberData?.role && memberData.status === "active") {
          setIsMember(true);
          setUserRole(memberData.role);
        } else {
          setIsMember(false);
          setUserRole(null);
        }
      }
  
      // Load background image and calculate text color
        if (organization?.background_image) {
          setOrgBackgroundImage(organization.background_image);
          calculateTextColor(organization.background_image);
        } else {
          // Default text color when no background image
          setBackgroundTextColor("text-white");
        }
  } catch (error) {
    console.error("Error fetching organization data:", error);
    toast.error("Failed to load organization data");
    navigate("/organizations");
  } finally {
    setIsLoading(false);
  }
}, [id, navigate, user]);

  const handleJoinOrganization = async () => {
  if (!user || !organization) return;

  try {
    const { error } = await (supabase
      .from("organization_members") as any)
      .insert([{
        organization_id: organization.id,
        user_id: user.id,
        role: "member",
        status: "active",
      }]);

    if (error) throw error;

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
    const { error } = await (supabase
      .from("organization_events") as any)
      .insert([{
        organization_id: organization.id,
        name: newEventForm.name,
        description: newEventForm.description,
        deadline: newEventForm.deadline,
        capacity: newEventForm.capacity,
        fee: newEventForm.fee,
        status: "upcoming",
        created_by: user.id,
        created_at: new Date().toISOString(),
        requires_payment: newEventForm.fee > 0,
        payment_instructions: newEventForm.fee > 0 ? "Please pay the event fee at the BizMart Store Office before your request can be approved." : undefined,
      }]);

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
    const { error } = await (supabase
      .from("organization_transactions") as any)
      .insert([{
        organization_id: organization.id,
        user_id: user.id,
        type: "deposit",
        amount,
        status: "pending",
        purpose: depositForm.purpose,
        reference: depositForm.reference,
        gcash_fee: 0,
      }]);

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
    const { error } = await (supabase
      .from("organization_transactions") as any)
      .insert([{
        organization_id: organization.id,
        user_id: user.id,
        type: "withdrawal",
        amount,
        status: "pending",
        purpose: withdrawalForm.purpose,
        reference: withdrawalForm.recipient,
        gcash_fee: 0,
      }]);

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
    const { error } = await (supabase
      .from("organization_announcements") as any)
      .insert([{
        organization_id: organization.id,
        title: newAnnouncementForm.title,
        content: newAnnouncementForm.content,
        created_by: user.id,
        created_at: new Date().toISOString(),
      }]);

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
    const { error } = await (supabase
      .from("organization_members") as any)
      .update({ status: "left" })
      .eq("id", memberToRemove);

    if (error) throw error;

    setMembers(prev =>
      prev.filter(member => member.id !== memberToRemove)
    );

    setMemberToRemove(null);
    toast.success("Member removed successfully");
  } catch (error) {
    console.error("Error removing member:", error);
    toast.error("Failed to remove member");
  }
};

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const { error } = await (supabase
        .from("organization_events") as any)
        .delete()
        .eq("id", eventToDelete);

      if (error) throw error;

      toast.success("Event deleted successfully!");
      fetchOrganizationData();
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleApproveJoinRequest = async () => {
    if (!eventJoinRequestToApprove) return;

    try {
      const request = eventJoinRequests.find(req => req.id === eventJoinRequestToApprove);
      if (!request) throw new Error("Request not found");

      const { error } = await supabase
        .from("event_join_requests")
        .update({ status: "approved" })
        .eq("id", eventJoinRequestToApprove);

      if (error) throw error;

      // Add user to organization members if not already a member
      const { data: existingMember } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", organization?.id)
        .eq("user_id", request.user_id)
        .maybeSingle();

      if (!existingMember) {
        await (supabase.from("organization_members") as any).insert([{
          organization_id: organization?.id,
          user_id: request.user_id,
          role: "member",
          status: "active",
        }]);
      }

      toast.success("Join request approved successfully!");
      fetchOrganizationData();
      setEventJoinRequestToApprove(null);
    } catch (error) {
      console.error("Error approving join request:", error);
      toast.error("Failed to approve join request");
    }
  };

  const handleRejectJoinRequest = async () => {
    if (!eventJoinRequestToReject) return;

    try {
      const { error } = await supabase
        .from("event_join_requests")
        .update({ status: "rejected" })
        .eq("id", eventJoinRequestToReject);

      if (error) throw error;

      toast.success("Join request rejected successfully!");
      fetchOrganizationData();
      setEventJoinRequestToReject(null);
    } catch (error) {
      console.error("Error rejecting join request:", error);
      toast.error("Failed to reject join request");
    }
  };

  const canManageMembers = userRole === "creator" || userRole === "officer";
  const isNotMember = userRole !== "member";
  const canManageEvents = userRole === "creator" || userRole === "officer";
  const canManageWallet = userRole === "creator" || userRole === "officer";
  const canCreateAnnouncements = userRole === "creator" || userRole === "officer";
  const canManageOrganization = userRole === "creator";
  const isRegularMember = userRole === "member";
  const isMemberOrAbove = userRole === "member" || userRole === "officer" || userRole === "creator";
  const isOfficerOrAbove = userRole === "officer" || userRole === "creator";

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
          <div>
            <h1 className="font-extrabold text-xl text-foreground flex items-center gap-2">
              <Crown className="h-5 w-5" /> {organization.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {organization.club_type} • {organization.member_count || 0} members
            </p>
          </div>
          {pendingJoinRequest ? (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" /> Pending Approval
            </Badge>
          ) : !isMember ? (
            <Button onClick={() => setIsJoinDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" /> Join Organization
            </Button>
          ) : (
            <Badge variant={userRole === "creator" ? "default" : userRole === "officer" ? "secondary" : "outline"}>
              {userRole === "creator" ? "Creator" : userRole === "officer" ? "Officer" : "Member"}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto mb-6 bg-muted/50 p-1 rounded-xl">
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
            <TabsTrigger value="freedom-wall" className="flex flex-col items-center gap-1 text-[10px] font-medium">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Freedom Wall</span>
            </TabsTrigger>
            {!isRegularMember && (
              <TabsTrigger value="wallet" className="flex flex-col items-center gap-1 text-[10px] font-medium">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="announcements" className="flex flex-col items-center gap-1 text-[10px] font-medium">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
            {canManageOrganization && (
              <TabsTrigger value="settings" className="flex flex-col items-center gap-1 text-[10px] font-medium">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <Card className={"bg-card " + backgroundTextColor}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Organization Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-2">{organization.description}</p>
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
              <Card className={"bg-card " + backgroundTextColor}>
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
                  {announcements.length === 0 && <p className="text-xs">No announcements yet</p>}
                </CardContent>
              </Card>
              <Card className={"bg-card " + backgroundTextColor}>
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
                        <p className="text-xs">Deadline: {event.deadline ? new Date(event.deadline).toLocaleDateString() : "N/A"}</p>
                        {event.fee > 0 && <p className="text-xs font-medium text-green-600">Fee: ₱{event.fee.toFixed(2)}</p>}
                      </div>
                    ))}
                  {events.filter((event) => event.status === "upcoming").length === 0 && <p className="text-xs">No upcoming events</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Freedom Wall Tab */}
          <TabsContent value="freedom-wall">
            <FreedomWall organizationId={organization.id} userRole={userRole} />
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
                            <AvatarImage src={member.profiles?.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.profiles?.first_name?.charAt(0) || "U"}{member.profiles?.last_name?.charAt(0) || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {member.profiles?.first_name && member.profiles?.last_name
                                ? `${member.profiles.first_name} ${member.profiles.last_name}`
                                : user?.id === member.user_id
                                  ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'You'
                                  : "Unknown User"}
                            </p>
                            <p className="text-xs text-muted-foreground">{member.profiles?.email || 'No email available'}</p>
                            <Badge variant={member.role === "creator" ? "default" : member.role === "officer" ? "secondary" : "outline"} className="mt-1">
                              {member.role === "creator" ? "Creator" : member.role === "officer" ? "Officer" : "Member"}
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
                            placeholder="0 for free events"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Requirements</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="requires-payment"
                            checked={newEventForm.fee > 0}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setNewEventForm({
                                ...newEventForm,
                                fee: checked ? 100 : 0
                              });
                            }}
                          />
                          <Label htmlFor="requires-payment" className="text-sm">
                            Require payment for this event
                          </Label>
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
                    <p className="text-sm mb-3">{event.description}</p>
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
                    {event.requires_payment && event.payment_instructions && (
                      <p className="text-xs text-muted-foreground mt-2 text-green-600">
                        <strong>Payment Required:</strong> {event.payment_instructions}
                      </p>
                    )}
                    {canManageEvents && eventJoinRequests.filter(req => req.event_id === event.id && req.status === "pending").length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2"
                        onClick={() => {
                          // Scroll to join requests section
                          document.getElementById('event-join-requests')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <Users className="h-4 w-4" />
                        View Join Requests ({eventJoinRequests.filter(req => req.event_id === event.id && req.status === "pending").length})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && <p className="text-muted-foreground text-sm">No events yet</p>}
            </div>

            {/* Event Join Requests Section - Only for creators and officers */}
            {canManageEvents && eventJoinRequests.length > 0 && (
              <div id="event-join-requests" className="mt-8">
                <h2 className="text-lg font-bold mb-4">Event Join Requests</h2>
                <div className="space-y-3">
                  {eventJoinRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">
                              {request.profiles?.first_name} {request.profiles?.last_name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Requested: {new Date(request.created_at).toLocaleString()}
                            </CardDescription>
                          </div>
                          <Badge variant={request.status === "pending" ? "default" : request.status === "approved" ? "secondary" : "destructive"}>
                            {request.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Event:</strong> {request.events?.name}</p>
                          <p><strong>Fee:</strong> ₱{request.events?.fee.toFixed(2)}</p>
                          {request.events?.requires_payment && (
                            <p className="text-green-600 font-medium">
                              <strong>Payment Required:</strong> {request.events?.fee > 0 ? "Yes - Pay at BizMart Store Office" : "No"}
                            </p>
                          )}
                          <p className="text-sm mt-2"><strong>Message:</strong></p>
                          <p className="text-sm text-muted-foreground">{request.events?.description}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="gap-2 flex-1"
                                onClick={() => {
                                  setEventJoinRequestToApprove(request.id);
                                }}
                              >
                                <Check className="h-4 w-4" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 flex-1"
                                onClick={() => {
                                  setEventJoinRequestToReject(request.id);
                                }}
                              >
                                <X className="h-4 w-4" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Join Event Button - For all members */}
          {isMemberOrAbove && (
            <div className="mb-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" /> Join Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Select an event you want to join. {isRegularMember ? "Your request will be reviewed by organization officers." : "You can join directly as an officer/creator."}
                    </p>
                    <div className="space-y-2">
                      <Label>Available Events</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {events
                          .filter(event => event.status === "upcoming")
                          .map((event) => (
                            <Card key={event.id} className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{event.name}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    Capacity: {event.capacity} • Fee: ₱{event.fee.toFixed(2)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    if (isRegularMember) {
                                      // Create join request
                                      try {
                                        const { error } = await supabase
                                          .from("event_join_requests")
                                          .insert([{
                                            event_id: event.id,
                                            user_id: user.id,
                                            organization_id: organization.id,
                                            status: "pending",
                                            created_at: new Date().toISOString(),
                                          }]);

                                        if (error) throw error;

                                        toast.success("Join request submitted! Waiting for approval.");
                                      } catch (error) {
                                        console.error("Error creating join request:", error);
                                        toast.error("Failed to submit join request");
                                      }
                                    } else {
                                      // Add directly as member
                                      try {
                                        const { error } = await (supabase.from("organization_members") as any).insert([{
                                          organization_id: organization.id,
                                          user_id: user.id,
                                          role: "member",
                                          status: "active",
                                        }]);

                                        if (error) throw error;

                                        toast.success("Successfully joined the event!");
                                      } catch (error) {
                                        console.error("Error joining event:", error);
                                        toast.error("Failed to join event");
                                      }
                                    }
                                  }}
                                >
                                  {isRegularMember ? "Request to Join" : "Join Now"}
                                </Button>
                              </div>
                              {event.requires_payment && event.payment_instructions && (
                                <p className="text-xs text-green-600 mt-2">
                                  {event.payment_instructions}
                                </p>
                              )}
                            </Card>
                          ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )

          {/* Wallet Tab - Only for creators and officers */}
          {canManageWallet && (
            <TabsContent value="wallet">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Organization Wallet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-600">
                        ₱{walletBalance.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Available Balance</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Deposit Form */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Deposit Funds</CardTitle>
                  <CardDescription>Request to deposit money into organization wallet</CardDescription>
                </CardHeader>
                <CardContent>
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
                        placeholder="e.g., Membership fees, Event funding"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-reference">Reference (Optional)</Label>
                      <Input
                        id="deposit-reference"
                        value={depositForm.reference}
                        onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })}
                        placeholder="e.g., GCash transaction number"
                      />
                    </div>
                    <Button
                      onClick={handleCreateDeposit}
                      className="w-full"
                      disabled={!depositForm.amount || parseFloat(depositForm.amount) <= 0}
                    >
                      Request Deposit
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal Form */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Withdraw Funds</CardTitle>
                  <CardDescription>Request to withdraw money from organization wallet</CardDescription>
                </CardHeader>
                <CardContent>
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
                      <Label htmlFor="withdrawal-recipient">Recipient Name *</Label>
                      <Input
                        id="withdrawal-recipient"
                        value={withdrawalForm.recipient}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, recipient: e.target.value })}
                        placeholder="e.g., John Doe"
                      />
                    </div>
                    <Button
                      onClick={handleCreateWithdrawal}
                      className="w-full"
                      disabled={!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0 || !withdrawalForm.recipient}
                    >
                      Request Withdrawal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Transaction History</CardTitle>
                  <CardDescription>Recent transactions and requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className={`p-3 border rounded-lg ${transaction.status === 'pending' ? 'bg-yellow-50 border-yellow-200' : transaction.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {transaction.status}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ₱{transaction.amount.toFixed(2)} • {transaction.purpose}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.reference && `Ref: ${transaction.reference}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

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

          {/* Settings Tab - Only for creators */}
          {canManageOrganization && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Organization Settings</CardTitle>
                  <CardDescription>Manage your organization's appearance and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Background Image Upload */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Organization Background Image</h3>
                      <div className="flex items-center gap-4">
                        {orgBackgroundImage ? (
                          <div className="relative">
                            <img
                              src={orgBackgroundImage}
                              alt="Organization background"
                              className="w-32 h-20 object-cover rounded-lg border"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0"
                              onClick={async () => {
                                if (!organization) return;
                                try {
                                  setIsUploadingImage(true);
                                  const { error } = await (supabase
                                    .from("organizations") as any)
                                    .update({ background_image: null })
                                    .eq("id", organization.id);
                                  if (error) throw error;
                                  setOrgBackgroundImage(null);
                                  toast.success("Background image removed!");
                                } catch (error) {
                                  console.error("Error removing background image:", error);
                                  toast.error("Failed to remove background image");
                                } finally {
                                  setIsUploadingImage(false);
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-32 h-20 bg-muted rounded-lg border flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">No image</p>
                          </div>
                        )}
                        <div className="flex-1">
                          <Label htmlFor="background-image-upload" className="cursor-pointer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              disabled={isUploadingImage}
                            >
                              {isUploadingImage ? "Uploading..." : "Upload Background Image"}
                            </Button>
                            <Input
                              id="background-image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !organization) return;
                                
                                try {
                                  setIsUploadingImage(true);
                                  
                                  // Upload to Supabase storage
                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `${organization.id}-bg-${Date.now()}.${fileExt}`;
                                  const filePath = `${fileName}`;
                                  
                                  const { error: uploadError } = await supabase
                                    .storage
                                    .from('organization-backgrounds')
                                    .upload(filePath, file);
                                  
                                  if (uploadError) throw uploadError;
                                  
                                  // Get public URL
                                  const { data: urlData } = supabase
                                    .storage
                                    .from('organization-backgrounds')
                                    .getPublicUrl(filePath);
                                  
                                  // Update organization record
                                  const { error: updateError } = await (supabase
                                    .from("organizations") as any)
                                    .update({ background_image: urlData.publicUrl })
                                    .eq("id", organization.id);
                                  
                                  if (updateError) throw updateError;
                                  
                                  setOrgBackgroundImage(urlData.publicUrl);
                                  toast.success("Background image uploaded successfully!");
                                } catch (error) {
                                  console.error("Error uploading background image:", error);
                                  toast.error("Failed to upload background image");
                                } finally {
                                  setIsUploadingImage(false);
                                }
                              }}
                            />
                          </Label>
                          <p className="text-xs text-muted-foreground mt-2">
                            Upload an image that will be used as the background for your organization
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
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

      {/* Join Organization Instruction Dialog */}
      <JoinOrganizationInstructionDialog
        organizationId={organization.id}
        organizationName={organization.name}
        isOpen={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        onSuccess={() => {
          checkPendingJoinRequest();
        }}
      />
    </div>
  );
}