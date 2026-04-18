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
import { Check, Copy, X, AlertCircle, Users, CheckCircle, XCircle, Eye, DollarSign, Calendar } from "lucide-react";
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
  const navigate = useNavigate();

  // Load all data
  useEffect(() => {
    loadCodes();
    loadPendingOrganizations();
    loadJoinRequests();
    loadApprovedOrganizations();
  }, []);

  // Load registration codes
  const loadCodes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await (supabase as any)
  .from("organization_members")
  .select(`*, profiles:user_id(*), organizations:organization_id(*)`)
  .eq("status", "pending")
  .order("joined_at", { ascending: false }); // Use joined_at instead of created_at

      if (error && error.code === 'PGRST205') {
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
    const { data, error } = await (supabase as any)
  .from("organizations")
  .select(`*, profiles:creator_id(*)`)
  .eq("status", "pending")
  .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST205') {
        setPendingOrgs([]);
        return;
      }

      if (error) throw error;

      // Get member counts
      const orgsWithCounts = await Promise.all(
        data?.map(async (org: PendingOrganization) => {
          const { count, error: countError } = await (supabase as any)
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id);

          if (countError) console.error("Error counting members:", countError);
          return { ...org, member_count: count || 0 };
        }) || []
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
    const { data, error } = await (supabase as any)
      .from("organizations")
      .select(`*, profiles!organizations_creator_id_fkey(first_name, last_name, email)`)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST205') {
        setApprovedOrgs([]);
        return;
      }

      if (error) throw error;

      // Get member counts
      const orgsWithCounts = await Promise.all(
        data?.map(async (org: ApprovedOrganization) => {
          const { count, error: countError } = await (supabase as any)
            .from("organization_members")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", org.id);

          if (countError) console.error("Error counting members:", countError);
          return { ...org, member_count: count || 0 };
        }) || []
      );

      setApprovedOrgs(orgsWithCounts);
    } catch (error) {
      console.error("Error loading approved organizations:", error);
      toast.error("Failed to load approved organizations");
    } finally {
      setIsLoadingApproved(false);
    }
  };

  // Generate registration codes
  const generateCodes = async () => {
    try {
      setIsGenerating(true);

      const newCodes = Array.from({ length: codeCount }, () => {
        return {
          code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          used: false
        };
      });

      let error = null;
      try {
        const { error: insertError } = await (supabase as any)
          .from("registration_codes")
          .insert(newCodes);
        error = insertError;
      } catch (err: any) {
        if (err.code === 'PGRST205') {
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
        const { error: insertError } = await (supabase as any)
          .from("organization_wallets")
          .insert({
            organization_id: orgId,
            balance: 0
          });
        walletError = insertError;
      } catch (err: any) {
        if (err.code !== 'PGRST205') {
          walletError = err;
        }
      }

      if (walletError) throw walletError;

      let orgError = null;
      try {
        const { error: updateError } = await (supabase as any)
          .from("organizations")
          .update({
            status: "approved",
            updated_at: new Date().toISOString()
          })
          .eq("id", orgId);
        orgError = updateError;
      } catch (err: any) {
        if (err.code !== 'PGRST205') {
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
        const { error: deleteError } = await (supabase as any)
          .from("organizations")
          .delete()
          .eq("id", orgId);
        error = deleteError;
      } catch (err: any) {
        if (err.code !== 'PGRST205') {
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

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  // Load join requests
  const loadJoinRequests = async () => {
  try {
    setIsLoadingRequests(true);
    const { data, error } = await (supabase as any)
      .from("organization_members")
      .select(`*, profiles!organization_members_user_id_fkey(first_name, last_name, email, avatar_url), organizations!organization_members_organization_id_fkey(name)`)
      .eq("status", "pending")
      .order("joined_at", { ascending: false }); // Fix: Use joined_at instead of created_at

      if (error && error.code === 'PGRST205') {
        setJoinRequests([]);
        return;
      }

      if (error) throw error;

      setJoinRequests((data as JoinRequest[]) || []);
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
      await (supabase as any)
        .from("organization_members")
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
      await (supabase as any)
        .from("organization_members")
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
              <CardDescription>View all approved organizations</CardDescription>
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
              <div className="space-y-3">
                {filteredApprovedOrgs.map((org) => (
                  <Card key={org.id} className="hover:shadow-md transition-shadow">
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
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => navigate(`/organizations/${org.id}`)}
                        >
                          <Eye className="h-4 w-4" /> View
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
    </div>
  );
}