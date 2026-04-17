"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Eye, Archive, Plus, Search, Ticket, DollarSign, Calendar, User, UsersRound } from "lucide-react";
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

  const fetchPendingOrganizations = useCallback(async () => {
    try {
      setIsLoading({ ...isLoading, pending: true });
      const { data, error } = await supabase
        .from("organizations")
        .select(`*, creator:profiles!fk_organizations_creator_id(first_name, last_name, email)`)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts
      const orgsWithCounts = await Promise.all(
        data?.map(async (org: Organization) => {
          const { count, error: countError } = await supabase
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id);

          if (countError) console.error("Error counting members:", countError);
          return { ...org, member_count: count || 0 };
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

  const fetchAllOrganizations = useCallback(async () => {
    try {
      setIsLoading({ ...isLoading, all: true });
      const { data, error } = await supabase
        .from("organizations")
        .select(`*, creator:profiles!fk_organizations_creator_id(first_name, last_name, email)`)
        .in("status", ["approved", "rejected", "archived"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts
      const orgsWithCounts = await Promise.all(
        data?.map(async (org: Organization) => {
          const { count, error: countError } = await supabase
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id);

          if (countError) console.error("Error counting members:", countError);
          return { ...org, member_count: count || 0 };
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

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading({ ...isLoading, transactions: true });
      const { data, error } = await supabase
        .from("organization_transactions")
        .select(`*, profile:profiles!fk_organization_transactions_user_id_fkey(first_name, last_name, avatar_url)`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading({ ...isLoading, transactions: false });
    }
  }, [isLoading]);

  const fetchCodes = useCallback(async () => {
    try {
      setIsLoading({ ...isLoading, codes: true });
      const { data, error } = await supabase
        .from("registration_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCodes(data || []);
    } catch (error) {
      console.error("Error fetching codes:", error);
      toast.error("Failed to load registration codes");
    } finally {
      setIsLoading({ ...isLoading, codes: false });
    }
  }, [isLoading]);

  useEffect(() => {
    fetchPendingOrganizations();
    fetchAllOrganizations();
    fetchTransactions();
    fetchCodes();
  }, [fetchPendingOrganizations, fetchAllOrganizations, fetchTransactions, fetchCodes]);

  const handleApproveOrganization = async () => {
    if (!orgToAction) return;

    try {
      const { error } = await (supabase
        .from("organizations") as any)
        .update({ status: "approved" })
        .eq("id", orgToAction as string);

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

  const handleRejectOrganization = async () => {
    if (!orgToAction) return;

    try {
      const { error } = await (supabase
        .from("organizations") as any)
        .update({ status: "rejected" })
        .eq("id", orgToAction as string);

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

  const handleArchiveOrganization = async (orgId: string) => {
    try {
      const { error } = await (supabase
        .from("organizations") as any)
        .update({ status: "archived" })
        .eq("id", orgId as string);

      if (error) throw error;

      toast.success("Organization archived successfully!");
      fetchAllOrganizations();
    } catch (error) {
      console.error("Error archiving organization:", error);
      toast.error("Failed to archive organization");
    }
  };

  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const { error } = await (supabase
        .from("organization_transactions") as any)
        .update({ status: "approved" })
        .eq("id", transactionId as string);

      if (error) throw error;

      // Update wallet balance
      const { data: transaction } = await supabase
        .from("organization_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (transaction) {
        const { data: wallet } = await (supabase
          .from("organization_wallets") as any)
          .select("balance")
          .eq("organization_id", (transaction as any).organization_id as string)
          .single();

        const newBalance = (transaction as any).type === "deposit"
          ? (wallet?.balance || 0) + ((transaction as any).amount as number)
          : (wallet?.balance || 0) - ((transaction as any).amount as number);

        await (supabase
          .from("organization_wallets") as any)
          .upsert({
            organization_id: (transaction as any).organization_id as string,
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

  const handleRejectTransaction = async (transactionId: string) => {
    try {
      const { error } = await (supabase
        .from("organization_transactions") as any)
        .update({ status: "rejected" })
        .eq("id", transactionId as string);

      if (error) throw error;

      toast.success("Transaction rejected successfully!");
      fetchTransactions();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    }
  };

  const handleGenerateCodes = async () => {
    try {
      const codesToCreate = Array.from({ length: newCodeCount }, () => ({
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        used: false,
      }));

      const { error } = await (supabase.from("registration_codes") as any).insert(codesToCreate);

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

  const handleRevokeCode = async () => {
    if (!codeToRevoke) return;

    try {
      const { error } = await (supabase
        .from("registration_codes") as any)
        .update({ used: true })
        .eq("id", codeToRevoke as string);

      if (error) throw error;

      toast.success("Code revoked successfully!");
      fetchCodes();
      setCodeToRevoke(null);
    } catch (error) {
      console.error("Error revoking code:", error);
      toast.error("Failed to revoke code");
    }
  };

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
        <TabsList className="grid grid-cols-4 w-full h-auto mb-6 bg-muted/50 p-1 rounded-xl">
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
                  <CardDescription>Manage all approved organizations</CardDescription>
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
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectTransaction(transaction.id)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Codes Tab */}
        <TabsContent value="codes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Registration Codes</CardTitle>
                  <CardDescription>Manage organization registration codes</CardDescription>
                </div>
                <Dialog open={newCodeDialogOpen} onOpenChange={setNewCodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" /> Generate Codes
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Registration Codes</DialogTitle>
                      <DialogDescription>
                        Create new registration codes for organizations to use when registering.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="code-count">Number of Codes to Generate</Label>
                        <Input
                          id="code-count"
                          type="number"
                          value={newCodeCount}
                          onChange={(e) => setNewCodeCount(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                        />
                      </div>
                      <Button onClick={handleGenerateCodes} className="w-full">
                        <Plus className="h-4 w-4 mr-2" /> Generate {newCodeCount} Code(s)
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading.codes ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredCodes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No registration codes found</p>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCodes.map((code) => (
                      <Card key={code.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg break-all">{code.code}</CardTitle>
                          <CardDescription className="text-xs">
                            Created: {new Date(code.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Badge variant={code.used ? "destructive" : "default"}>
                            {code.used ? "Used" : "Available"}
                          </Badge>
                          {!code.used && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="mt-3 w-full gap-2"
                              onClick={() => {
                                setCodeToRevoke(code.id);
                              }}
                            >
                              <XCircle className="h-4 w-4" /> Revoke Code
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Join Requests Tab */}
        <TabsContent value="join-requests">
          <JoinRequestsTab />
        </TabsContent>
      </Tabs>

      {/* Revoke Code Confirmation */}
      <AlertDialog open={!!codeToRevoke} onOpenChange={() => setCodeToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Registration Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this registration code? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevokeCode} className="bg-destructive hover:bg-destructive/90">
              Revoke Code
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
