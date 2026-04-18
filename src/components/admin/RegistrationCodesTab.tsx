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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Copy, X, AlertCircle, Users, CheckCircle, XCircle, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
}

interface JoinRequest {
  id: string;
  organization_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reference_number: string | null;
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  organization?: {
    name: string;
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

  // Ensure tables exist
  const ensureTablesExist = async () => {
    try {
      // Try to create all organization-related tables at once
      const { error } = await (supabase as any)
        .rpc('create_all_organization_tables_if_not_exists');
      
      if (error) {
        console.warn("Could not ensure tables exist:", error);
      }
    } catch (error) {
      console.warn("Could not ensure tables exist:", error);
    }
  };

  // Load registration codes
  const loadCodes = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await (supabase as any)
        .from("registration_codes")
        .select("*")
        .order("created_at", { ascending: false });

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
        .select("*")
        .order("created_at", { ascending: false });
        .order("created_at", { ascending: false });

      if (error && error.code === 'PGRST205') {
        setPendingOrgs([]);
        return;
      }

      if (error) throw error;

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

      setPendingOrgs(orgsWithCounts || []);
    } catch (error) {
      console.error("Error loading pending organizations:", error);
      toast.error("Failed to load pending organizations");
    } finally {
      setIsLoadingOrgs(false);
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

  useEffect(() => {
ensureTablesExist().then(() => {
  loadCodes();
  loadPendingOrganizations();
  loadJoinRequests();
});
}, []);

  // Load join requests
  const loadJoinRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const { data, error } = await (supabase as any)
        .from("organization_members")
        .select(`*, profile:profiles!organization_members_user_id_fkey(first_name, last_name, email, avatar_url), organization:organizations!organization_members_organization_id_fkey(name)`)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

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

  // Also reload when component comes back into view
  useEffect(() => {
    const interval = setInterval(() => {
      loadCodes();
      loadPendingOrganizations();
      loadJoinRequests();
    }, 30000); // Reload every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Approve join request
  const approveJoinRequest = async (requestId: string) => {
    try {
      // @ts-ignore - TypeScript is too strict about the update type
      await (supabase as any)
        .from("organization_members")
        .update({
          status: "approved",
        })
        .eq("id", requestId);

      toast.success("Join request approved successfully!");
      loadJoinRequests();
    } catch (error) {
      console.error("Error approving join request:", error);
      toast.error("Failed to approve join request");
    }
  };

  // Reject join request
  const rejectJoinRequest = async (requestId: string) => {
    try {
      // @ts-ignore - TypeScript is too strict about the update type
      await (supabase as any)
        .from("organization_members")
        .update({
          status: "rejected",
        })
        .eq("id", requestId);

      toast.success("Join request rejected successfully!");
      loadJoinRequests();
    } catch (error) {
      console.error("Error rejecting join request:", error);
      toast.error("Failed to reject join request");
    }
  };

  return (
    <div className="space-y-6">
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
            ) : activeJoinTab === "pending" && joinRequests.filter(req => req.status === "pending").length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending join requests</p>
            ) : activeJoinTab === "approved" && joinRequests.filter(req => req.status === "approved").length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No approved join requests</p>
            ) : activeJoinTab === "rejected" && joinRequests.filter(req => req.status === "rejected").length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No rejected join requests</p>
            ) : (
              <div className="space-y-3">
                {joinRequests
                  .filter(req => {
                    if (activeJoinTab === "pending") return req.status === "pending";
                    if (activeJoinTab === "approved") return req.status === "approved";
                    if (activeJoinTab === "rejected") return req.status === "rejected";
                    return true;
                  })
                  .map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {request.profile?.first_name?.charAt(0) || "U"}{request.profile?.last_name?.charAt(0) || ""}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {request.profile?.first_name} {request.profile?.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">{request.profile?.email}</p>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p><strong>Organization:</strong> {request.organization?.name || "N/A"}</p>
                              <p><strong>Reference Number:</strong> {request.reference_number || "N/A"}</p>
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
                            )
                            }
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => (window as any).navigate(`/organizations/${request.organization_id}`)}
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

      <Card>
        <CardHeader>
          <CardTitle>Pending Organizations</CardTitle>
          <CardDescription>
            Review and approve organizations that have submitted for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingOrgs ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : pendingOrgs.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No pending organizations to review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Adviser</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{org.club_type}</Badge>
                    </TableCell>
                    <TableCell>{org.adviser_name || "-"}</TableCell>
                    <TableCell>{org.member_count || 0}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveOrganization(org.id)}
                          title="Approve organization"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectOrganization(org.id)}
                          title="Reject organization"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
