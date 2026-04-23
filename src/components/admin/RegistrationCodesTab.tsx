"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Copy, X, AlertCircle, Users, CheckCircle, XCircle, Eye, DollarSign, Calendar, Wallet, CreditCard, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface RegistrationCode {
  id: string;
  code: string;
  used: boolean;
  created_at: string;
}

interface PendingOrganization {
  id: string;
  name: string;
  description: string;
  adviser_name: string;
  club_type: string;
  status: string;
  creator_id: string;
  created_at: string;
  member_count?: number;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface JoinRequest {
  id: string;
  organization_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reference_number: string | null;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  organizations?: {
    name: string;
  };
}

interface ApprovedOrganization {
  id: string;
  name: string;
  description: string;
  adviser_name: string | null;
  club_type: string;
  status: string;
  creator_id: string;
  created_at: string;
  member_count?: number;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface EventMemberRequest {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'joined';
  joined_at: string;
  payment_proof?: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  events?: {
    id: string;
    name: string;
    fee: number;
  };
}

interface OrganizationTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  purpose: string;
  reference: string | null;
  gcash_fee: number;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  organizations?: {
    name: string;
  };
}

interface PaymentReference {
  id: string;
  organization_id: string;
  reference_code: string;
  amount: number;
  status: string;
  used: boolean;
  used_by?: string | null;
  used_at?: string | null;
  created_at: string;
  organizations?: {
    name: string;
  } | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

const CLUB_TYPES = ["Academic", "Sports", "Arts", "Other"];

export default function RegistrationCodesTab() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [codeCount, setCodeCount] = useState(5);
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrganization[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [activeJoinTab, setActiveJoinTab] = useState("pending");
  const [activeOrgTab, setActiveOrgTab] = useState("pending");
  const [approvedOrgs, setApprovedOrgs] = useState<ApprovedOrganization[]>([]);
  const [isLoadingApproved, setIsLoadingApproved] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<OrganizationTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [activeWalletTab, setActiveWalletTab] = useState("pending");
  const [selectedOrgForDetails, setSelectedOrgForDetails] = useState<any>(null);
  const [orgEvents, setOrgEvents] = useState<any[]>([]);
  const [eventMemberRequests, setEventMemberRequests] = useState<any[]>([]);
  const [isLoadingOrgDetails, setIsLoadingOrgDetails] = useState(false);
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);
  const [paymentReferences, setPaymentReferences] = useState<PaymentReference[]>([]);
  const [selectedOrgForReference, setSelectedOrgForReference] = useState<any>(null);
  const [referenceAmount, setReferenceAmount] = useState("0.00");
  const [showGenerateReferenceDialog, setShowGenerateReferenceDialog] = useState(false);
  const navigate = useNavigate();

  // Load all data
  useEffect(() => {
    loadCodes();
    loadPendingOrganizations();
    loadJoinRequests();
    loadApprovedOrganizations();
    loadTransactions();
    loadPaymentReferences();
  }, []);

  // Load registration codes
  const loadCodes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("registration_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setCodes([]);
        return;
      }

      if (error) throw error;

      setCodes(data || []);
    } catch (error) {
      console.error("Error loading codes:", error);
      toast.error("Failed to load registration codes");
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending organizations
  const loadPendingOrganizations = async () => {
  try {
    setIsLoadingOrgs(true);
    const { data, error } = await supabase
  .from("organizations" as any)
  .select(`*, profiles:creator_id(*)`)
  .eq("status", "pending")
  .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setPendingOrgs([]);
        return;
      }

      if (error) throw error;

      // Get member counts
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org: any) => {
          try {
            const { count, error: countError } = await supabase
              .from("organization_event_members" as any)
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id);

            if (countError) {
              console.error("Error counting members:", countError);
              return { ...org, member_count: 0 };
            }
            return { ...org, member_count: count || 0 };
          } catch (error) {
            console.error("Error counting members:", error);
            return { ...org, member_count: 0 };
          }
        })
      );

      setPendingOrgs(orgsWithCounts);
    } catch (error) {
      console.error("Error loading pending organizations:", error);
      toast.error("Failed to load pending organizations");
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  // Load approved organizations
  const loadApprovedOrganizations = async () => {
  try {
    setIsLoadingApproved(true);
    const { data, error } = await supabase
  .from("organizations" as any)
  .select(`*, profiles:creator_id(*)`)
  .eq("status", "approved")
  .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setApprovedOrgs([]);
        return;
      }

      if (error) throw error;

      // Get member counts
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org: any) => {
          try {
            const { count, error: countError } = await supabase
              .from("organization_event_members" as any)
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id);

            if (countError) {
              console.error("Error counting members:", countError);
              return { ...org, member_count: 0 };
            }
            return { ...org, member_count: count || 0 };
          } catch (error) {
            console.error("Error counting members:", error);
            return { ...org, member_count: 0 };
          }
        })
      );

      setApprovedOrgs(orgsWithCounts);
    } catch (error) {
      console.error("Error loading approved organizations:", error);
      toast.error("Failed to load approved organizations");
    } finally {
      setIsLoadingApproved(false);
    }
  };

  // Load organization transactions
  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const { data, error } = await supabase
        .from("organization_transactions" as any)
        .select(`*, profiles:user_id(first_name, last_name, avatar_url), organizations:organization_id(name)`)
        .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setTransactions([]);
        return;
      }

      if (error) throw error;

      setTransactions((data || []) as any);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Load payment references
  const loadPaymentReferences = async () => {
    try {
      setIsLoadingReferences(true);
      const { data, error } = await supabase
        .from("payment_references")
        .select(`*, organizations:organization_id(name), profiles:used_by(first_name, last_name)`)
        .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setPaymentReferences([]);
        return;
      }

      if (error) throw error;

      setPaymentReferences((data || []) as unknown as PaymentReference[]);
    } catch (error) {
      console.error("Error loading payment references:", error);
      toast.error("Failed to load payment references");
    } finally {
      setIsLoadingReferences(false);
    }
  };

  // Generate registration codes
  const generateCodes = async () => {
    try {
      setIsGenerating(true);

      const newCodes = Array.from({ length: codeCount }, () => {
        return {
          code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          used: false,
          created_at: new Date().toISOString()
        };
      });

      let error = null;
      try {
        const { error: insertError } = await supabase
          .from("registration_codes")
          .insert(newCodes);
        error = insertError;
      } catch (err: any) {
        if (err.code === 'PGRST116') {
          console.warn("registration_codes table doesn't exist yet");
        } else {
          error = err;
        }
      }

      if (error) throw error;

      toast.success(`Successfully generated ${codeCount} registration codes`);
      await loadCodes();
    } catch (error) {
      console.error("Error generating codes:", error);
      toast.error("Failed to generate registration codes");
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve organization
  const approveOrganization = async (orgId: string) => {
    try {
      let walletError = null;
      try {
        const { error: insertError } = await supabase
          .from("organization_wallets")
          .insert({
            organization_id: orgId,
            balance: 0
          });
        walletError = insertError;
      } catch (err: any) {
        if (err.code !== 'PGRST116') {
          walletError = err;
        }
      }

      if (walletError) throw walletError;

      let orgError = null;
      try {
        const { error: updateError } = await supabase
          .from("organizations")
          .update({
            status: "approved",
            updated_at: new Date().toISOString()
          })
          .eq("id", orgId);
        orgError = updateError;
      } catch (err: any) {
        if (err.code !== 'PGRST116') {
          orgError = err;
        }
      }

      if (orgError) throw orgError;

      toast.success("Organization approved successfully!");
      await loadPendingOrganizations();
      await loadApprovedOrganizations();
    } catch (error) {
      console.error("Error approving organization:", error);
      toast.error("Failed to approve organization");
    }
  };

  // Reject organization
  const rejectOrganization = async (orgId: string) => {
    try {
      let error = null;
      try {
        const { error: deleteError } = await supabase
          .from("organizations")
          .delete()
          .eq("id", orgId);
        error = deleteError;
      } catch (err: any) {
        if (err.code !== 'PGRST116') {
          error = err;
        }
      }

      if (error) throw error;

      toast.success("Organization rejected successfully!");
      await loadPendingOrganizations();
      await loadApprovedOrganizations();
    } catch (error) {
      console.error("Error rejecting organization:", error);
      toast.error("Failed to reject organization");
    }
  };

  // Approve transaction
  const approveTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("organization_transactions")
        .update({
          status: "approved",
          updated_at: new Date().toISOString()
        })
        .eq("id", transactionId);

      if (error) throw error;

      // Update organization wallet balance
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        // Get current balance
        const { data: walletData, error: walletError } = await supabase
          .from("organization_wallets")
          .select("balance")
          .eq("organization_id", transaction.organization_id)
          .maybeSingle();

        if (walletError) throw walletError;

        const currentBalance = walletData?.balance || 0;
        const newBalance = transaction.type === 'deposit'
          ? currentBalance + transaction.amount
          : currentBalance - transaction.amount;

        // Update balance
        const { error: updateError } = await supabase
          .from("organization_wallets")
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq("organization_id", transaction.organization_id);

        if (updateError) throw updateError;
      }

      toast.success("Transaction approved successfully!");
      await loadTransactions();
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    }
  };

  // Reject transaction
  const rejectTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("organization_transactions")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("id", transactionId);

      if (error) throw error;

      toast.success("Transaction rejected successfully!");
      await loadTransactions();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    }
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  // Load join requests
  const loadJoinRequests = async () => {
  try {
    setIsLoadingRequests(true);
    const { data, error } = await supabase
      .from("organization_event_members" as any)
      .select(`*, profiles!organization_event_members_user_id_fkey(first_name, last_name, email, avatar_url), organizations!organization_event_members_organization_id_fkey(name)`)
      .eq("status", "pending")
      .order("joined_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setJoinRequests([]);
        return;
      }

      if (error) throw error;

      setJoinRequests((data as any) || [] as JoinRequest[]);
    } catch (error) {
      console.error("Error loading join requests:", error);
      toast.error("Failed to load join requests");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Approve join request
  const approveJoinRequest = async (requestId: string) => {
    try {
      await supabase
        .from("organization_event_members" as any)
        .update({
          status: "active",
        })
        .eq("id", requestId);

      toast.success("Join request approved successfully!");
      await loadJoinRequests();
    } catch (error) {
      console.error("Error approving join request:", error);
      toast.error("Failed to approve join request");
    }
  };

  // Reject join request
  const rejectJoinRequest = async (requestId: string) => {
    try {
      await supabase
        .from("organization_event_members" as any)
        .update({
          status: "rejected",
        })
        .eq("id", requestId);

      toast.success("Join request rejected successfully!");
      await loadJoinRequests();
    } catch (error) {
      console.error("Error rejecting join request:", error);
      toast.error("Failed to reject join request");
    }
  };

  // Load organization details and events
  const loadOrganizationDetails = async (orgId: string) => {
    try {
      setIsLoadingOrgDetails(true);
      
      // Load organization wallet
      const { data: walletData, error: walletError } = await supabase
        .from("organization_wallets" as any)
        .select("balance")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (walletError) throw walletError;

      // Load organization events
      const { data: eventsData, error: eventsError } = await supabase
        .from("organization_events" as any)
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;

      // Load event member requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("organization_event_members" as any)
        .select(`*, profiles:user_id(first_name, last_name, email, avatar_url), events:event_id(name, fee)`)
        .eq("status", "pending")
        .in("event_id", eventsData?.map((e: any) => e.id) || [])
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      setOrgEvents(eventsData as any || []);
      setEventMemberRequests((requestsData as any) || []);
      
      // Update selected org with wallet balance
      if (selectedOrgForDetails) {
        setSelectedOrgForDetails({
          ...selectedOrgForDetails,
          wallet_balance: (walletData as any)?.balance || 0
        } as any);
      }
    } catch (error) {
      console.error("Error loading organization details:", error);
      toast.error("Failed to load organization details");
    } finally {
      setIsLoadingOrgDetails(false);
    }
  };

  // Approve event member request
  const approveEventMemberRequest = async (requestId: string) => {
    try {
      const request = eventMemberRequests.find((r: any) => r.id === requestId);
      if (!request) return;

      // Update event member status to approved
      const { error } = await supabase
        .from("organization_event_members" as any)
        .update({
          status: "approved",
        })
        .eq("id", requestId);

      if (error) throw error;

      // If event has a fee, add to organization wallet
      if (request.events?.fee && request.events.fee > 0) {
        const { error: walletError } = await supabase
          .from("organization_wallets")
          .update({
            balance: ((selectedOrgForDetails as any)?.wallet_balance || 0) + request.events.fee
          })
          .eq("organization_id", (selectedOrgForDetails as any)?.id);

        if (walletError) throw walletError;

        // Add transaction record
        const { error: transactionError } = await supabase
          .from("organization_transactions")
          .insert([{
            organization_id: (selectedOrgForDetails as any)?.id,
            user_id: request.user_id,
            type: "deposit",
            amount: request.events.fee,
            status: "approved",
            purpose: `Event fee: ${request.events.name}`,
            reference: `Event: ${request.events.name}`,
            gcash_fee: 0,
          }]);

        if (transactionError) throw transactionError;
      }

      toast.success("Member approved successfully!");
      loadOrganizationDetails((selectedOrgForDetails as any)?.id || "");
    } catch (error) {
      console.error("Error approving event member request:", error);
      toast.error("Failed to approve member request");
    }
  };

  // Reject event member request
  const rejectEventMemberRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("organization_event_members" as any)
        .update({
          status: "rejected",
        })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Member request rejected successfully!");
      loadOrganizationDetails((selectedOrgForDetails as any)?.id || "");
    } catch (error) {
      console.error("Error rejecting event member request:", error);
      toast.error("Failed to reject member request");
    }
  };

  // Filtered data
  const filteredPendingOrgs = pendingOrgs.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.club_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApprovedOrgs = approvedOrgs.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.club_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJoinRequests = joinRequests.filter((req) => {
    if (activeJoinTab === "pending") return req.status === "pending";
    if (activeJoinTab === "approved") return req.status === "approved";
    if (activeJoinTab === "rejected") return req.status === "rejected";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Generate Codes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Registration Codes</CardTitle>
          <CardDescription>
            Create unique registration codes for organizations to use when registering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code-count">Number of codes to generate</Label>
            <Select
              value={codeCount.toString()}
              onValueChange={(value) => setCodeCount(Number(value))}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select number" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Code</SelectItem>
                <SelectItem value="5">5 Codes</SelectItem>
                <SelectItem value="10">10 Codes</SelectItem>
                <SelectItem value="20">20 Codes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateCodes}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>Generate {codeCount} Registration Code{codeCount > 1 ? 's' : ''}</>
            )}
          </Button>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Available Codes ({codes.filter(c => !c.used).length})</h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : codes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registration codes generated yet</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {codes
                  .filter(c => !c.used)
                  .map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border"
                    >
                      <Badge variant="outline" className="font-mono text-sm">
                        {code.code}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => copyToClipboard(code.code)}
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {codes.filter(c => c.used).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Used Codes ({codes.filter(c => c.used).length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {codes
                  .filter(c => c.used)
                  .map((code) => (
                    <div
                      key={code.id}
                      className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg border border-destructive/20"
                    >
                      <Badge variant="outline" className="font-mono text-sm">
                        {code.code}
                      </Badge>
                      <Badge variant="destructive" className="text-xs">Used</Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization Details Modal */}
      <Dialog open={!!selectedOrgForDetails} onOpenChange={(open) => {
        if (!open) {
          setSelectedOrgForDetails(null);
          setOrgEvents([]);
          setEventMemberRequests([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedOrgForDetails?.name} - Organization Details</DialogTitle>
              <DialogDescription>
                View organization information, events, and approve event member requests
              </DialogDescription>
            </DialogHeader>
  
            {isLoadingOrgDetails ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-6">
              {/* Organization Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Organization Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Type</p>
                      <p className="text-sm text-muted-foreground">{selectedOrgForDetails?.club_type}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Status</p>
                      <Badge variant="default">{selectedOrgForDetails?.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Adviser</p>
                      <p className="text-sm text-muted-foreground">{selectedOrgForDetails?.adviser_name || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">{new Date(selectedOrgForDetails?.created_at || "").toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-sm text-muted-foreground">{selectedOrgForDetails?.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organization Wallet */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Organization Wallet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-600">
                      ₱{(selectedOrgForDetails as any)?.wallet_balance?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                  </div>
                </CardContent>
              </Card>

              {/* Organization Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Organization Events ({orgEvents.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orgEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {orgEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{event.name}</h3>
                            <Badge variant={event.status === "upcoming" ? "default" : event.status === "ongoing" ? "secondary" : "outline"}>
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-medium">Deadline</p>
                              <p>{event.deadline ? new Date(event.deadline).toLocaleDateString() : "N/A"}</p>
                            </div>
                            <div>
                              <p className="font-medium">Capacity</p>
                              <p>{event.capacity}</p>
                            </div>
                            <div>
                              <p className="font-medium">Fee</p>
                              <p>₱{event.fee.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="font-medium">Created</p>
                              <p>{new Date(event.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Member Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Event Member Requests ({eventMemberRequests.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventMemberRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending event member requests</p>
                  ) : (
                    <div className="space-y-3">
                      {eventMemberRequests.map((request) => (
                        <Card key={request.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {request.profiles?.first_name?.charAt(0) || "U"}{request.profiles?.last_name?.charAt(0) || ""}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {request.profiles?.first_name} {request.profiles?.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{request.profiles?.email}</p>
                                  </div>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Event:</strong> {request.events?.name || "N/A"}</p>
                                  <p><strong>Fee:</strong> ₱{request.events?.fee || 0}</p>
                                  <p><strong>Requested:</strong> {new Date(request.created_at).toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4 flex-shrink-0">
                                <Button
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => approveEventMemberRequest(request.id)}
                                  title="Approve request"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => rejectEventMemberRequest(request.id)}
                                  title="Reject request"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Join Requests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organization Join Requests</CardTitle>
          <CardDescription>
            Approve or reject requests to join organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeJoinTab === "pending" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setActiveJoinTab("pending")}
              >
                <Users className="h-4 w-4" /> Pending ({joinRequests.filter(req => req.status === "pending").length})
              </Button>
              <Button
                variant={activeJoinTab === "approved" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setActiveJoinTab("approved")}
              >
                <CheckCircle className="h-4 w-4" /> Approved
              </Button>
              <Button
                variant={activeJoinTab === "rejected" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setActiveJoinTab("rejected")}
              >
                <XCircle className="h-4 w-4" /> Rejected
              </Button>
            </div>

            {isLoadingRequests ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredJoinRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No join requests found</p>
            ) : (
              <div className="space-y-3">
                {filteredJoinRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {request.profiles?.first_name?.charAt(0) || "U"}{request.profiles?.last_name?.charAt(0) || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {request.profiles?.first_name} {request.profiles?.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">{request.profiles?.email}</p>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p><strong>Organization:</strong> {request.organizations?.name || "N/A"}</p>
                            {request.reference_number && (
                              <p><strong>Reference:</strong> {request.reference_number}</p>
                            )}
                            <p><strong>Requested:</strong> {new Date(request.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveJoinRequest(request.id)}
                                title="Approve request"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectJoinRequest(request.id)}
                                title="Reject request"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/organizations/${request.organization_id}`)}
                            title="View organization"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approved Organizations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Approved Organizations ({approvedOrgs.length})</CardTitle>
              <CardDescription>View all approved organizations - swipe left/right to view more</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingApproved ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredApprovedOrgs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No approved organizations found</p>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search approved organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-0"
                />
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                {filteredApprovedOrgs.map((org) => (
                  <Card key={org.id} className="flex-shrink-0 w-80 hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {org.club_type} • Status: {org.status}
                          </CardDescription>
                        </div>
                        <Badge variant="default">
                          {org.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{org.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {new Date(org.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>Members: {org.member_count || 0}</span>
                        </div>
                        {org.adviser_name && (
                          <div className="flex items-center gap-2 col-span-2">
                            <Users className="h-3 w-3" />
                            <span>Adviser: {org.adviser_name}</span>
                          </div>
                        )}
                        {org.profiles && (
                          <div className="flex items-center gap-2 col-span-2">
                            <Users className="h-3 w-3" />
                            <span>Creator: {org.profiles.first_name} {org.profiles.last_name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => {
                              setSelectedOrgForDetails(org);
                              loadOrganizationDetails(org.id);
                            }}
                          >
                            <Eye className="h-4 w-4" /> View Details
                          </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Transactions Approval Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wallet Transactions Approval</CardTitle>
          <CardDescription>Approve or reject deposit and withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeWalletTab === "pending" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setActiveWalletTab("pending")}
              >
                <CheckCircle className="h-4 w-4" /> Pending ({transactions.filter(t => t.status === "pending").length})
              </Button>
              <Button
                variant={activeWalletTab === "approved" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setActiveWalletTab("approved")}
              >
                <Check className="h-4 w-4" /> Approved
              </Button>
              <Button
                variant={activeWalletTab === "rejected" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setActiveWalletTab("rejected")}
              >
                <X className="h-4 w-4" /> Rejected
              </Button>
            </div>

            {isLoadingTransactions ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Wallet Transactions Section */}
                <div className="space-y-3">
                  {transactions
                    .filter(t => {
                      if (activeWalletTab === "pending") return t.status === "pending";
                      if (activeWalletTab === "approved") return t.status === "approved";
                      if (activeWalletTab === "rejected") return t.status === "rejected";
                      return true;
                    })
                    .map((transaction) => (
                      <Card key={transaction.id} className={"hover:shadow-md transition-shadow".concat(
                        transaction.status === "pending" ? " border-2 border-yellow-200" :
                        transaction.status === "approved" ? " border-2 border-green-200" :
                        " border-2 border-red-200"
                      )}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {transaction.profiles?.first_name?.charAt(0) || "U"}{transaction.profiles?.last_name?.charAt(0) || ""}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    {transaction.type === "deposit" ? "Deposit" : "Withdrawal"}
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" : transaction.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                      {transaction.status}
                                    </span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Organization:</strong> {transaction.organizations?.name || "N/A"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Amount:</strong> ₱{transaction.amount.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Purpose:</strong> {transaction.purpose}
                                  </p>
                                  {transaction.reference && (
                                    <p className="text-xs text-muted-foreground">
                                      <strong>Reference:</strong> {transaction.reference}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Requested:</strong> {new Date(transaction.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4 flex-shrink-0">
                              {transaction.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => approveTransaction(transaction.id)}
                                    title="Approve transaction"
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0"
                                    onClick={() => rejectTransaction(transaction.id)}
                                    title="Reject transaction"
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => navigate(`/organizations/${transaction.organization_id}`)}
                                title="View organization"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {transactions.filter(t => {
                    if (activeWalletTab === "pending") return t.status === "pending";
                    if (activeWalletTab === "approved") return t.status === "approved";
                    if (activeWalletTab === "rejected") return t.status === "rejected";
                    return true;
                  }).length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No {activeWalletTab} transactions found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Organizations Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Organizations ({pendingOrgs.length})</CardTitle>
              <CardDescription>Review and approve new organization registrations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingOrgs ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredPendingOrgs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending organizations to review</p>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search pending organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-0"
                />
              </div>
              <div className="space-y-3">
                {filteredPendingOrgs.map((org) => (
                  <Card key={org.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {org.club_type} • Created: {new Date(org.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{org.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>Adviser: {org.adviser_name || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>Members: {org.member_count || 0}</span>
                        </div>
                        {org.profiles && (
                          <div className="flex items-center gap-2 col-span-2">
                            <Users className="h-3 w-3" />
                            <span>Creator: {org.profiles.first_name} {org.profiles.last_name} ({org.profiles.email})</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => approveOrganization(org.id)}
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => rejectOrganization(org.id)}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment References Section - Simplified */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Payment References ({paymentReferences.length})</span>
            <div className="flex gap-2">
              <Select
                value={selectedOrgForReference?.id || ""}
                onValueChange={(value) => {
                  const org = approvedOrgs.find(o => o.id === value);
                  setSelectedOrgForReference(org || null);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {approvedOrgs.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="gap-1"
                onClick={async () => {
                  if (!selectedOrgForReference) {
                    toast.error("Please select an organization first");
                    return;
                  }
                  
                  try {
                    // Generate a realistic 6-digit payment reference number
                    const refNumber = Math.floor(100000 + Math.random() * 900000).toString();
                    
                    const { error, data: newRef } = await supabase
                      .from("payment_references")
                      .insert([{
                        organization_id: selectedOrgForReference.id,
                        reference_code: refNumber,
                        amount: 50.00,
                        used: false,
                      }])
                      .select(`*, organizations:organization_id(name)`);
                    
                    if (error) {
                      console.error("Error generating payment reference:", error);
                      toast.error("Failed to generate payment reference");
                      return;
                    }
                    
                    if (newRef && newRef[0]) {
                      // Add the new reference to the state
                      setPaymentReferences(prev => [...prev, newRef[0] as unknown as PaymentReference]);
                    }
                    
                    toast.success(`Payment reference generated: ${refNumber} for ${selectedOrgForReference.name}`);
                  } catch (error) {
                    console.error("Error generating payment reference:", error);
                    toast.error("Failed to generate payment reference");
                  }
                }}
                disabled={!selectedOrgForReference}
              >
                <Plus className="h-3 w-3" /> Generate Reference
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-xs">
            Payment references for organization join requests - track which users have paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingReferences ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : paymentReferences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payment references generated yet</p>
          ) : (
            <div className="space-y-2">
              {paymentReferences.map((ref) => (
                <Card key={ref.id} className={"hover:shadow-md transition-shadow".concat(
                  ref.used ? " border-2 border-green-200 bg-green-50/50" : ""
                )}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{ref.reference_code}</p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Organization:</strong> {ref.organizations?.name || "N/A"} •
                              <strong>Amount:</strong> ₱{Number(ref.amount).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Status:</strong>
                              <Badge variant={ref.used ? "outline" : "default"}>
                                {ref.used ? "Used" : "Available"}
                              </Badge>
                            </p>
                            {ref.used && ref.profiles && (
                              <p className="text-xs text-muted-foreground">
                                <strong>Used by:</strong> {ref.profiles.first_name} {ref.profiles.last_name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              <strong>Created:</strong> {new Date(ref.created_at).toLocaleString()}
                              {ref.used_at && <span> • <strong>Used:</strong> {new Date(ref.used_at).toLocaleString()}</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}