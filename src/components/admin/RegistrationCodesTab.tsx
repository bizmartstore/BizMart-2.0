"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Copy, X, Users, Search, Plus, UserPlus, CheckCircle2, AlertCircle, Eye, Trash2, Calendar, Users as UsersIcon, DollarSign, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface RegistrationCode {
  id: string;
  code: string;
  used: boolean;
  created_at: string;
}

interface JoinRequest {
  id: string;
  organization_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  joined_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  organizations?: {
    id: string;
    name: string;
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

export default function RegistrationCodesTab() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [codeCount, setCodeCount] = useState(5);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [transactions, setTransactions] = useState<OrganizationTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [approvedOrgs, setApprovedOrgs] = useState<any[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [activeTab, setActiveTab] = useState<'organizations' | 'approved' | 'join' | 'transactions' | 'codes'>('organizations');
  const navigate = useNavigate();

  useEffect(() => {
    loadCodes();
    loadJoinRequests();
    loadTransactions();
    loadPendingOrganizations();
    loadApprovedOrganizations();
  }, []);

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

  const loadJoinRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const { data, error } = await supabase
        .from("organization_members")
        .select(`*, profiles:user_id(first_name, last_name, email, avatar_url), organizations:organization_id(name)`)
        .eq("status", "pending")
        .order("joined_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setJoinRequests([]);
        return;
      }

      if (error) throw error;

      setJoinRequests((data as any) || []);
    } catch (error) {
      console.error("Error loading join requests:", error);
      toast.error("Failed to load join requests");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const { data, error } = await supabase
        .from("organization_transactions")
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

  const generateCodes = async () => {
    try {
      const newCodes = Array.from({ length: codeCount }, () => ({
        code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        used: false,
        created_at: new Date().toISOString()
      }));

      let error = null;
      try {
        const { error: insertError } = await supabase
          .from("registration_codes")
          .insert(newCodes);
        error = insertError;
      } catch (err: any) {
        if (err.code !== 'PGRST116') error = err;
      }

      if (error) throw error;

      toast.success(`Successfully generated ${codeCount} registration codes`);
      await loadCodes();
    } catch (error) {
      console.error("Error generating codes:", error);
      toast.error("Failed to generate registration codes");
    }
  };

  const approveJoinRequest = async (requestId: string) => {
    try {
      const request = joinRequests.find((r: any) => r.id === requestId);
      if (!request) return;

      await supabase
        .from("organization_members")
        .update({ status: "active" })
        .eq("id", requestId);

      toast.success("Join request approved successfully!");
      await loadJoinRequests();
    } catch (error) {
      console.error("Error approving join request:", error);
      toast.error("Failed to approve join request");
    }
  };

  const rejectJoinRequest = async (requestId: string) => {
    try {
      await supabase
        .from("organization_members")
        .update({ status: "rejected" })
        .eq("id", requestId);

      toast.success("Join request rejected successfully!");
      await loadJoinRequests();
    } catch (error) {
      console.error("Error rejecting join request:", error);
      toast.error("Failed to reject join request");
    }
  };

  const approveTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("organization_transactions")
        .update({ status: "approved" })
        .eq("id", transactionId);

      if (error) throw error;

      toast.success("Transaction approved successfully!");
      await loadTransactions();
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    }
  };

  const rejectTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("organization_transactions")
        .update({ status: "rejected" })
        .eq("id", transactionId);

      if (error) throw error;

      toast.success("Transaction rejected successfully!");
      await loadTransactions();
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    }
  };

  const loadPendingOrganizations = async () => {
    try {
      setIsLoadingOrgs(true);
      const { data, error } = await supabase
        .from("organizations")
        .select(`*, profiles:creator_id(*)`)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setPendingOrgs([]);
        return;
      }

      if (error) throw error;

      setPendingOrgs(data || []);
    } catch (error) {
      console.error("Error loading pending organizations:", error);
      toast.error("Failed to load pending organizations");
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const approveOrganization = async (orgId: string) => {
    try {
      // Create wallet for organization
      const { error: walletError } = await supabase
        .from("organization_wallets")
        .insert({
          organization_id: orgId,
          balance: 0
        });

      if (walletError) throw walletError;

      // Approve organization
      const { error: orgError } = await supabase
        .from("organizations")
        .update({ status: "approved" })
        .eq("id", orgId);

      if (orgError) throw orgError;

      toast.success("Organization approved successfully!");
      await loadPendingOrganizations();
    } catch (error) {
      console.error("Error approving organization:", error);
      toast.error("Failed to approve organization");
    }
  };

  const rejectOrganization = async (orgId: string) => {
    try {
      // Delete organization
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);

      if (error) throw error;

      toast.success("Organization rejected successfully!");
      await loadPendingOrganizations();
    } catch (error) {
      console.error("Error rejecting organization:", error);
      toast.error("Failed to reject organization");
    }
  };

  const loadApprovedOrganizations = async () => {
    try {
      setIsLoadingOrgs(true);
      const { data, error } = await supabase
        .from("organizations")
        .select(`*, profiles:creator_id(*)`)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST116') {
        setApprovedOrgs([]);
        return;
      }

      if (error) throw error;

      setApprovedOrgs(data || []);
    } catch (error) {
      console.error("Error loading approved organizations:", error);
      toast.error("Failed to load approved organizations");
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'organizations' ? 'default' : 'outline'}
          className="flex-1 gap-2"
          onClick={() => setActiveTab('organizations')}
        >
          <UsersIcon className="h-4 w-4" /> Pending Organizations
        </Button>
        <Button
          variant={activeTab === 'approved' ? 'default' : 'outline'}
          className="flex-1 gap-2"
          onClick={() => setActiveTab('approved')}
        >
          <CheckCircle2 className="h-4 w-4" /> Approved Organizations
        </Button>
        <Button
          variant={activeTab === 'join' ? 'default' : 'outline'}
          className="flex-1 gap-2"
          onClick={() => setActiveTab('join')}
        >
          <UsersIcon className="h-4 w-4" /> Join Requests
        </Button>
        <Button
          variant={activeTab === 'transactions' ? 'default' : 'outline'}
          className="flex-1 gap-2"
          onClick={() => setActiveTab('transactions')}
        >
          <DollarSign className="h-4 w-4" /> Transactions
        </Button>
        <Button
          variant={activeTab === 'codes' ? 'default' : 'outline'}
          className="flex-1 gap-2"
          onClick={() => setActiveTab('codes')}
        >
          <Copy className="h-4 w-4" /> Codes
        </Button>
      </div>

      {activeTab === 'join' && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Join Requests</CardTitle>
            <CardDescription>Approve or reject requests to join organizations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : joinRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending join requests</p>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {request.profiles?.first_name?.charAt(0) || 'U'}{request.profiles?.last_name?.charAt(0) || ''}
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
                            <p><strong>Organization:</strong> {request.organizations?.name || 'N/A'}</p>
                            <p><strong>Requested:</strong> {new Date(request.joined_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveJoinRequest(request.id)}
                            title="Approve request"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectJoinRequest(request.id)}
                            title="Reject request"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
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
          </CardContent>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Wallet Transactions</CardTitle>
            <CardDescription>Approve or reject deposit and withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions found</p>
            ) : (
              <div className="space-y-3">
                {transactions
                  .filter(t => t.status === 'pending')
                  .map((transaction) => (
                    <Card key={transaction.id} className="border-2 border-yellow-200 hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {transaction.profiles?.first_name?.charAt(0) || 'U'}{transaction.profiles?.last_name?.charAt(0) || ''}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                                  <Badge variant="outline" className="ml-2 text-xs">Pending</Badge>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Organization:</strong> {transaction.organizations?.name || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Amount:</strong> ₱{transaction.amount.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Purpose:</strong> {transaction.purpose}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Requested:</strong> {new Date(transaction.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
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
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'organizations' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Organizations</CardTitle>
            <CardDescription>Review and approve new organization registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOrgs ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : pendingOrgs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending organizations to review</p>
            ) : (
              <div className="space-y-3">
                {pendingOrgs.map((org) => (
                  <Card key={org.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">
                            <h3 className="font-medium">{org.name}</h3>
                            <Badge variant="secondary" className="text-xs mt-1">{org.club_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{org.description}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>Adviser:</strong> {org.adviser_name || 'N/A'}</p>
                            <p><strong>Creator:</strong> {org.profiles?.first_name} {org.profiles?.last_name} ({org.profiles?.email})</p>
                            <p><strong>Created:</strong> {new Date(org.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => approveOrganization(org.id)}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectOrganization(org.id)}
                          >
                            <X className="h-4 w-4 text-red-600" /> Reject
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
      )}

      {activeTab === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>Approved Organizations</CardTitle>
            <CardDescription>View, modify, and manage approved organizations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingOrgs ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : approvedOrgs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No approved organizations found</p>
            ) : (
              <div className="space-y-3">
                {approvedOrgs.map((org) => (
                  <Card key={org.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2">
                            <h3 className="font-medium">{org.name}</h3>
                            <Badge variant="default" className="text-xs mt-1">{org.club_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{org.description}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>Adviser:</strong> {org.adviser_name || 'N/A'}</p>
                            <p><strong>Creator:</strong> {org.profiles?.first_name} {org.profiles?.last_name} ({org.profiles?.email})</p>
                            <p><strong>Created:</strong> {new Date(org.created_at).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <Badge variant="outline">{org.status}</Badge></p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/organizations/${org.id}`)}
                            title="View organization details"
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
          </CardContent>
        </Card>
      )}

      {activeTab === 'codes' && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Registration Codes</CardTitle>
            <CardDescription>Create unique registration codes for organizations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code-count">Number of codes to generate</Label>
              <Select value={codeCount.toString()} onValueChange={(value) => setCodeCount(Number(value))}>
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

            <Button onClick={generateCodes} className="w-full sm:w-auto">
              Generate {codeCount} Registration Code{codeCount > 1 ? 's' : ''}
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
                      <div key={code.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
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
                      <div key={code.id} className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
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
      )}
    </div>
  );
}