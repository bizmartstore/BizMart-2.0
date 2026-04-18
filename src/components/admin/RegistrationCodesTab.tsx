"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Copy, X, AlertCircle, Users, CheckCircle, XCircle, Calendar, CreditCard } from "lucide-react";

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

const CLUB_TYPES = ["Academic", "Sports", "Arts", "Other"];

export default function RegistrationCodesTab() {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [codeCount, setCodeCount] = useState(5);
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrganization[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  // Join request approval states
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [joinRequestFilter, setJoinRequestFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [isLoadingJoinRequests, setIsLoadingJoinRequests] = useState(true);
  const [isLoadingJoinRequestAction, setIsLoadingJoinRequestAction] = useState(false);

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
        .eq("status", "pending")
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

  // Also reload when component comes back into view
  useEffect(() => {
    const interval = setInterval(() => {
      loadCodes();
      loadPendingOrganizations();
      loadJoinRequests();
    }, 30000); // Reload every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Load join requests
  const loadJoinRequests = async () => {
    try {
      setIsLoadingJoinRequests(true);
      
      const { data, error } = await supabase
        .from("organization_members")
        .select("*, profile:user_id(*), organization:organization_id(*)")
        .eq("status", joinRequestFilter === "all" ? undefined : joinRequestFilter)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setJoinRequests((data as any[]) || []);
    } catch (error) {
      console.error("Error loading join requests:", error);
      toast.error("Failed to load join requests");
    } finally {
      setIsLoadingJoinRequests(false);
    }
  };

  // Handle join request approval
  const handleApproveJoinRequest = async (requestId: string) => {
    try {
      const { error } = await (supabase
        .from("organization_members") as any)
        .update({ status: "active" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Join request approved successfully!");
      loadJoinRequests();
    } catch (error) {
      console.error("Error approving join request:", error);
      toast.error("Failed to approve join request");
    }
  };

  // Handle join request rejection
  const handleRejectJoinRequest = async (requestId: string) => {
    try {
      setIsLoadingJoinRequestAction(true);
      const { error } = await (supabase
        .from("organization_members") as any)
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Join request rejected successfully!");
      loadJoinRequests();
    } catch (error) {
      console.error("Error rejecting join request:", error);
      toast.error("Failed to reject join request");
    } finally {
      setIsLoadingJoinRequestAction(false);
    }
  };

  // Get organization name from ID
  const getOrganizationName = async (orgId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single();

      if (error) throw error;
      return data?.name || "Unknown Organization";
    } catch (error) {
      console.error("Error fetching organization name:", error);
      return "Unknown Organization";
    }
  };

  // Filter join requests by organization
  const filteredJoinRequests = joinRequests.filter(request => {
    if (joinRequestFilter === "all") return true;
    return request.status === joinRequestFilter;
  });

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

      <Card>
        <CardHeader>
          <CardTitle>Join Requests Approval</CardTitle>
          <CardDescription>
            Review and approve join requests to organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={joinRequestFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinRequestFilter("pending")}
              >
                Pending ({joinRequests.filter(r => r.status === "pending").length})
              </Button>
              <Button
                variant={joinRequestFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinRequestFilter("approved")}
              >
                Approved ({joinRequests.filter(r => r.status === "approved").length})
              </Button>
              <Button
                variant={joinRequestFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinRequestFilter("rejected")}
              >
                Rejected ({joinRequests.filter(r => r.status === "rejected").length})
              </Button>
              <Button
                variant={joinRequestFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setJoinRequestFilter("all")}
              >
                All ({joinRequests.length})
              </Button>
            </div>

            {isLoadingJoinRequests ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredJoinRequests.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No join requests found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJoinRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {request.profile?.first_name?.charAt(0) || "U"}{request.profile?.last_name?.charAt(0) || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {request.profile?.first_name} {request.profile?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{request.profile?.email}</p>
                          </div>
                        </div>
                        <Badge variant={request.status === "pending" ? "secondary" : request.status === "approved" ? "default" : "destructive"}>
                          {request.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <p><strong>Organization:</strong> {request.organization?.name || "Unknown"}</p>
                        {request.reference_number && (
                          <p><strong>Reference Number:</strong> {request.reference_number}</p>
                        )}
                        <p><strong>Role:</strong> {request.role}</p>
                        <p><strong>Joined:</strong> {new Date(request.created_at).toLocaleString()}</p>
                      </div>

                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={async () => {
                              setIsLoadingJoinRequestAction(true);
                              try {
                                const { error } = await (supabase
                                  .from("organization_members") as any)
                                  .update({ status: "approved" })
                                  .eq("id", request.id);

                                if (error) throw error;

                                toast.success("Join request approved!");
                                loadJoinRequests();
                              } catch (error) {
                                console.error("Error approving join request:", error);
                                toast.error("Failed to approve join request");
                              } finally {
                                setIsLoadingJoinRequestAction(false);
                              }
                            }}
                            disabled={isLoadingJoinRequestAction}
                          >
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => handleRejectJoinRequest(request.id)}
                            disabled={isLoadingJoinRequestAction}
                          >
                            <X className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
