"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Search, Plus, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import JoinOrganizationInstructionDialog from "@/components/JoinOrganizationInstructionDialog";
import { Organization } from "@/types";

export default function OrganizationsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [pendingJoinRequest, setPendingJoinRequest] = useState(false);
  const [registrationCode, setRegistrationCode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    adviser_name: "",
    club_type: "Academic",
  });
  const [joinOrgDialogOpen, setJoinOrgDialogOpen] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const checkPendingJoinRequest = async (orgId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("id, status")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error("Error checking pending join request:", error);
      return false;
    }
  };

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      
      // First check if the organizations table exists
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1); // Just check if table exists with a small query

      if (orgError && orgError.code === 'PGRST205') {
        // Table doesn't exist, set empty organizations and return
        setOrganizations([]);
        return;
      }

      if (orgError) {
        console.error("Supabase error:", orgError);
        throw orgError;
      }

      // Get member counts for each organization with timeout
      const orgsWithCounts = await Promise.all(
        (orgData || []).map(async (org: any) => {
          try {
            const { count, error: countError } = await supabase
              .from("organization_members")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id)
              .limit(1); // Limit to 1 for faster count

            if (countError) {
              console.error("Error counting members:", countError);
              return { ...org, member_count: 0 };
            }

            // Check if user has pending join request for this org
            let hasPendingRequest = false;
            if (user) {
              hasPendingRequest = await checkPendingJoinRequest(org.id);
            }

            return { ...org, member_count: count || 0, hasPendingRequest };
          } catch (countError) {
            console.error("Error in member count query:", countError);
            return { ...org, member_count: 0 };
          }
        })
      );

      setOrganizations(orgsWithCounts || [] as Organization[]);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]); // Set to empty array on error
      toast.error("Failed to load organizations. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterOrganization = async () => {
    if (!user || !profile) {
      toast.error("Please log in to register an organization");
      return;
    }

    if (!registrationCode) {
      toast.error("Registration code is required");
      return;
    }

    try {
      // Verify registration code
      const { data: codeData, error: codeError } = await supabase
        .from("registration_codes")
        .select("*")
        .eq("code", registrationCode)
        .eq("used", false)
        .maybeSingle();

      if (codeError) {
        console.error("Code verification error:", codeError);
        throw codeError;
      }
      if (!codeData) {
        toast.error("Invalid or already used registration code");
        return;
      }

      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.name,
          description: formData.description,
          adviser_name: formData.adviser_name,
          club_type: formData.club_type,
          status: "pending",
          creator_id: user.id,
        } as any)
        .select()
        .single() as { data: any; error: any };

      if (orgError) {
        console.error("Organization creation error:", orgError);
        throw orgError;
      }

      // Mark code as used
      await (supabase
        .from("registration_codes") as any)
        .update({ used: true })
        .eq("id", (codeData as any).id);

      // Add creator as member with creator role
      await (supabase
        .from("organization_members") as any)
        .insert({
          organization_id: (orgData as any).id,
          user_id: user.id,
          role: "creator",
        });

      toast.success("Organization registration submitted for approval!");
      setIsRegisterModalOpen(false);
      fetchOrganizations();
      resetForm();
    } catch (error) {
      console.error("Error registering organization:", error);
      toast.error("Failed to register organization. Please check your registration code.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      adviser_name: "",
      club_type: "Academic",
    });
    setRegistrationCode("");
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.club_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-4">
        <div className="mb-6">
          <h1 className="font-extrabold text-xl text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" /> Organizations
          </h1>
          <p className="text-xs text-muted-foreground">
            Browse and join school clubs and organizations
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Register Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Organization</DialogTitle>
                <DialogDescription>
                  Fill out the form below to register your organization. It will be reviewed by an admin.
                  <br />
                  <strong>Note:</strong> You need a registration code from an admin to register.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Computer Science Club"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-description">Description *</Label>
                  <Input
                    id="org-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your organization"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-adviser">Adviser Name (Optional)</Label>
                  <Input
                    id="org-adviser"
                    value={formData.adviser_name}
                    onChange={(e) => setFormData({ ...formData, adviser_name: e.target.value })}
                    placeholder="e.g., Mr. Smith"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-type">Club Type *</Label>
                  <Select value={formData.club_type} onValueChange={(value) => setFormData({ ...formData, club_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select club type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Academic">Academic</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration-code">Registration Code *</Label>
                  <Input
                    id="registration-code"
                    value={registrationCode}
                    onChange={(e) => setRegistrationCode(e.target.value)}
                    placeholder="Enter registration code from admin"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your organization's adviser or an admin for a registration code.
                  </p>
                </div>

                <Button onClick={handleRegisterOrganization} className="w-full">
                  Submit for Approval
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {organizations.length === 0
                ? "No organizations have been approved yet. Check back later!"
                : "No organizations match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrganizations.map((org) => {
              const isApproved = org.status === "approved";
              return (
                <Card key={org.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/organizations/${org.id}`)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{org.club_type}</CardDescription>
                      </div>
                      <Badge variant={isApproved ? "default" : "secondary"}>
                        {org.club_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{org.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{org.member_count || 0} members</span>
                      </div>
                      {org.adviser_name && (
                        <div className="flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />
                          <span>{org.adviser_name}</span>
                        </div>
                      )}
                    </div>
                    {isApproved && !pendingJoinRequest && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentOrgId(org.id);
                            setJoinOrgDialogOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4" /> Join Organization
                        </Button>
                      </div>
                    )}
                    {isApproved && pendingJoinRequest && (
                      <div className="mt-3">
                        <Badge variant="secondary" className="gap-1 w-full justify-center">
                          <AlertCircle className="h-3 w-3" /> Pending Approval
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />

      {/* Join Organization Instruction Dialog */}
      {currentOrgId && (
        <JoinOrganizationInstructionDialog
          organizationId={currentOrgId}
          organizationName={organizations.find((o) => o.id === currentOrgId)?.name || "Organization"}
          isOpen={joinOrgDialogOpen}
          onOpenChange={setJoinOrgDialogOpen}
          onSuccess={() => {
            setJoinOrgDialogOpen(false);
            setCurrentOrgId(null);
            fetchOrganizations();
          }}
        />
      )}
    </div>
  );
}
