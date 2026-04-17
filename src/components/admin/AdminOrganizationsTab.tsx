"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Archive,
  Plus,
  Search,
  Ticket,
  DollarSign,
  Calendar,
  User,
  UsersRound,
  Settings,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Organization, Transaction, RegistrationCode } from "@/types";
import JoinRequestsTab from "@/components/admin/JoinRequestsTab";

export default function AdminOrganizationsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingOrgs, setPendingOrgs] = useState<Organization[]>([]);
  const [allOrgs, setAllOrgs] = useState<Organization[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [isLoading, setIsLoading] = useState({
    pending: true,
    all: true,
    transactions: true,
    codes: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [orgToAction, setOrgToAction] = useState<string | null>(null);
  const [codeToRevoke, setCodeToRevoke] = useState<string | null>(null);
  const [newCodeDialogOpen, setNewCodeDialogOpen] = useState(false);
  const [newCodeCount, setNewCodeCount] = useState(1);

  // Fetch all organizations (pending, approved, rejected, archived)
  const fetchAllOrganizations = useCallback(async () => {
    try {
      setIsLoading({ ...isLoading, all: true });
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          id,
          name,
          description,
          club_type,
          adviser_name,
          status,
          created_at,
          creator_id,
          creator:profiles!fk_organizations_creator_id(first_name, last_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get member counts for each organization
      const orgsWithCounts = await Promise.all(
        data?.map(async (org: Organization) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const { count, error: countError } = await supabase
              .from("organization_members")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id)
              .limit(1)
              .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (countError) console.error("Error counting members:", countError);
            return { ...org, member_count: count || 0 };
          } catch (countError) {
            console.error("Error in member count query:", countError);
            return { ...org, member_count: 0 };
          }
        }) || []
      );

      setAllOrgs(orgsWithCounts);
    } catch (error) {
      console.error("Error fetching all organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setIsLoading({ ...isLoading, all: false });
    }
  }, [isLoading]);

  // Fetch pending organizations
  const fetchPendingOrganizations = useCallback(async () => {
    try {
      setIsLoading({ ...isLoading, pending: true });
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          id,
          name,
          description,
          club_type,
          adviser_name,
          status,
          created_at,
          creator_id,
          creator:profiles!fk_organizations_creator_id(first_name, last_name, email)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get member counts for each organization
      const orgsWithCounts = await Promise.all(
        data?.map(async (org: Organization) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const { count, error: countError } = await supabase
              .from("organization_members")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id)
              .limit(1)
              .abortSignal(controller.signal);

            clearTimeout(timeoutId);

            if (countError) console.error("Error counting members:", countError);
            return { ...org, member_count: count || 0 };
          } catch (countError) {
            console.error("Error in member count query:", countError);
            return { ...org, member_count: 0 };
          }
        }) || []
      );

      setPendingOrgs(orgsWithCounts);
    } catch (error) {
      console.error("Error fetching pending organizations:", error);
      toast.error("Failed to load pending organizations");
    } finally {
      setIsLoading({ ...isLoading, pending: false });
    }
  }, [isLoading]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading({ ...isLoading, transactions: true });
      const { data, error } = await supabase
        .from("organization_transactions")
        .select(`
          id,
          amount,
          type,
          purpose,
          status,
          created_at,
          user_id,
          profile:profiles!fk_org_tx_user(first_name, last_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading({ ...isLoading, transactions: false });
    }
  }, [isLoading]);

  // Fetch registration codes
  const fetchCodes = useCallback(async () => {
    try {
      setIsLoading({ ...isLoading, codes: true });
      const { data, error } = await supabase
        .from("registration_codes")
        .select(`
          id,
          code,
          used,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setCodes(data || []);
    } catch (error) {
      console.error("Error fetching codes:", error);
      toast.error("Failed to load registration codes");
    } finally {
      setIsLoading({ ...isLoading, codes: false });
    }
  }, [isLoading]);

  // Initialize all fetches
  useEffect(() => {
    fetchAllOrganizations();
    fetchPendingOrganizations();
    fetchTransactions();
    fetchCodes();
  }, [fetchAllOrganizations, fetchPendingOrganizations, fetchTransactions, fetchCodes]);

  // Approve organization
  const handleApproveOrganization = async () => {
    if (!orgToAction) return;

    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status: "approved" })
        .eq("id", orgToAction);

      if (error) throw error;

      toast.success("Organization approved successfully!");
      fetchPendingOrganizations();
      fetchAllOrganizations();
      setIsApproveDialogOpen(false);
      setOrgToAction(null);
    } catch (error) {
      console.error("Error approving organization:", error);
      toast.error("Failed to approve organization");
    }
  };

  // Reject organization
  const handleRejectOrganization = async () => {
    if (!orgToAction) return;

    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status: "rejected" })
        .eq("id", orgToAction);

      if (error) throw error;

      toast.success("Organization rejected successfully!");
      fetchPendingOrganizations();
      fetchAllOrganizations();
      setIsRejectDialogOpen(false);
      setOrgToAction(null);
    } catch (error) {
      console.error("Error rejecting organization:", error);
      toast.error("Failed to reject organization");
    }
  };

  // Archive organization
  const handleArchiveOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status: "archived" })
        .eq("id", orgId);

      if (error) throw error;

      toast.success("Organization archived successfully!");
      fetchAllOrganizations();
    } catch (error) {
      console.error("Error archiving organization:", error);
      toast.error("Failed to archive organization");
    }
  };

  // Approve transaction
  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("organization_transactions")
        .update({ status: "approved" })
        .eq("id", transactionId);

      if (error) throw error;

      // Update wallet balance
      const { data: transaction } = await supabase
        .from("organization_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (transaction) {
        const { data: wallet } = await supabase
          .from("organization_wallets")
          .select("balance")
          .eq("organization_id", transaction.organization_id)
          .single();

        const newBalance = transaction.type === "deposit"
          ? (wallet?.balance || 0) + transaction.amount
          : (wallet?.balance || 0) - transaction.amount;

        await supabase
          .from("organization_wallets")
          .upsert({
            organization_id: transaction.organization_id,
            balance: newBalance,
          });
      }

      toast.success("Transaction approved successfully!");
      fetchTransactions();
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    }
  };

  // Reject transaction
  const handleRejectTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("organization_transactions")
        .update({ status: "rejected" })
        .eq("id", transactionId);

      if (error) throw error;

      toast.success("Transaction rejected successfully!");
      fetchTransactions();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    }
  };

  // Generate registration codes
  const handleGenerateCodes = async () => {
    try {
      const codesToCreate = Array.from({ length: newCodeCount }, () => ({
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        used: false,
      }));

      const { error } = await supabase
        .from("registration_codes")
        .insert(codesToCreate);

      if (error) throw error;

      toast.success(`${newCodeCount} registration code(s) generated successfully!`);
      fetchCodes();
      setNewCodeDialogOpen(false);
      setNewCodeCount(1);
    } catch (error) {
      console.error("Error generating codes:", error);
      toast.error("Failed to generate codes");
    }
  };

  // Revoke registration code
  const handleRevokeCode = async () => {
    if (!codeToRevoke) return;

    try {
      const { error } = await supabase
        .from("registration_codes")
        .update({ used: true })
        .eq("id", codeToRevoke);

      if (error) throw error;

      toast.success("Code revoked successfully!");
      fetchCodes();
      setCodeToRevoke(null);
    } catch (error) {
      console.error("Error revoking code:", error);
      toast.error("Failed to revoke code");
    }
  };

  // Filtered lists
  const filteredPendingOrgs = pendingOrgs.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.club_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAllOrgs = allOrgs.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.club_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter((transaction) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.purpose.toLowerCase().includes(searchLower) ||
      transaction.type.toLowerCase().includes(searchLower) ||
      transaction.status.toLowerCase().includes(searchLower) ||
      transaction.profile?.first_name?.toLowerCase().includes(searchLower) ||
      transaction.profile?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const filteredCodes = codes.filter((code) =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full h-auto mb-6 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="pending" className="flex flex-col items-center gap-1 text-[10px] font-medium">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Pending</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex flex-col items-center gap-1 text-[10px] font-medium">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">All Organizations</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex flex-col items-center gap-1 text-[10px] font-medium">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="codes" className="flex flex-col items-center gap-1 text-[10px] font-medium">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Codes</span>
          </TabsTrigger>
          <TabsTrigger value="join-requests" className="flex flex-col items-center gap-1 text-[10px] font-medium">
            <UsersRound className="h-4 w-4" />
            <span className="hidden sm:inline">Join Requests</span>
          </TabsTrigger>
        </TabsList>

        {/* Pending Organizations Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Organizations ({pendingOrgs.length})</CardTitle>
              <CardDescription>Review and approve new organization registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.pending ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredPendingOrgs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending organizations</p>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pending organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
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
                              <User className="h-3 w-3" />
                              <span>Adviser: {org.adviser_name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              <span>Members: {org.member_count || 0}</span>
                            </div>
                            {org.creator && (
                              <div className="flex items-center gap-2 col-span-2">
                                <User className="h-3 w-3" />
                                <span>Creator: {org.creator.first_name} {org.creator.last_name} ({org.creator.email})</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={() => {
                                setOrgToAction(org.id);
                                setSelectedOrg(org);
                                setIsApproveDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => {
                                setOrgToAction(org.id);
                                setSelectedOrg(org);
                                setIsRejectDialogOpen(true);
                              }}
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

          {/* Approve Organization Dialog */}
          <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve Organization</DialogTitle>
                <DialogDescription>
                  Are you sure you want to approve <strong>{selectedOrg?.name}</strong>?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><strong>Type:</strong> {selectedOrg?.club_type}</p>
                  <p className="text-sm"><strong>Description:</strong> {selectedOrg?.description}</p>
                  <p className="text-sm"><strong>Adviser:</strong> {selectedOrg?.adviser_name || "N/A"}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApproveOrganization} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Reject Organization Dialog */}
          <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Organization</DialogTitle>
                <DialogDescription>
                  Are you sure you want to reject <strong>{selectedOrg?.name}</strong>?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm"><strong>Type:</strong> {selectedOrg?.club_type}</p>
                  <p className="text-sm"><strong>Description:</strong> {selectedOrg?.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRejectOrganization} variant="destructive" className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* All Organizations Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">All Organizations ({allOrgs.length})</CardTitle>
                  <CardDescription>Manage all organizations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading.all ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredAllOrgs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No organizations found</p>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="space-y-3">
                    {filteredAllOrgs.map((org) => (
                      <Card key={org.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{org.name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {org.club_type} • Status: {org.status}
                              </CardDescription>
                            </div>
                            <Badge variant={org.status === "approved" ? "default" : org.status === "rejected" ? "destructive" : "secondary"}>
                              {org.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">{org.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span>Adviser: {org.adviser_name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              <span>Members: {org.member_count || 0}</span>
                            </div>
                            {org.creator && (
                              <div className="flex items-center gap-2 col-span-2">
                                <User className="h-3 w-3" />
                                <span>Creator: {org.creator.first_name} {org.creator.last_name}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 gap-2"
                              onClick={() => navigate(`/organizations/${org.id}`)}
                            >
                              <Eye className="h-4 w-4" /> View
                            </Button>
                            {org.status === "approved" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1 gap-2"
                                onClick={() => handleArchiveOrganization(org.id)}
                              >
                                <Archive className="h-4 w-4" /> Archive
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Transactions</CardTitle>
              <CardDescription>Review and approve all organization transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading.transactions ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions found</p>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Organization</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
  {filteredTransactions.map((transaction) => (
    <TableRow key={transaction.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {transaction.profile?.first_name?.charAt(0) || "O"}
              {transaction.profile?.last_name?.charAt(0) || ""}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {transaction.profile?.first_name} {transaction.profile?.last_name}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={transaction.type === "deposit" ? "default" : "destructive"}>
          {transaction.type}
        </Badge>
      </TableCell>
      <TableCell className="font-bold">
        ₱{transaction.amount.toFixed(2)}
      </TableCell>
      <TableCell className="text-sm">{transaction.purpose}</TableCell>
      <TableCell>
        <Badge variant={transaction.status === "pending" ? "secondary" : transaction.status === "approved" ? "default" : "destructive"}>
          {transaction.status}
        </Badge>
      </TableCell>
      <TableCell className="text-xs">
        {new Date(transaction.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {transaction.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApproveTransaction(transaction.id)}
            >
              <CheckCircle className="h-3 w-3" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRejectTransaction(transaction.id)}
            >
              <XCircle className="h-3 w-3" /> Reject
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  ))}
</TableBody>