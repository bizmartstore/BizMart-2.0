"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Search, Plus, UserPlus, CheckCircle2, AlertCircle, Eye, X, CreditCard } from "lucide-react";
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
    primary_color: "#3b82f6",
    secondary_color: "#1e40af",
  });
  const [orgBackgroundImage, setOrgBackgroundImage] = useState<File | null>(null);
    const [orgLogoImage, setOrgLogoImage] = useState<File | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [joinOrgDialogOpen, setJoinOrgDialogOpen] = useState(false);
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
    const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({
      name: "",
      description: "",
      adviser_name: "",
      club_type: "Academic",
      primary_color: "#3b82f6",
      secondary_color: "#1e40af",
    });
    const [editLogoImage, setEditLogoImage] = useState<File | null>(null);
    const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
      
      // Set up realtime subscription for payment references changes
      const paymentRefsChannel = supabase
        .channel('payment_references_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payment_references'
          },
          () => {
            fetchOrganizations();
          }
        )
        .subscribe();
      
      // Set up realtime subscription for organization changes
      const orgsChannel = supabase
        .channel('organizations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organizations'
          },
          () => {
            fetchOrganizations();
          }
        )
        .subscribe()
      
      return () => {
        supabase.removeChannel(orgsChannel);
        supabase.removeChannel(paymentRefsChannel);
      };
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const checkMembershipStatus = async (orgId: string) => {
    if (!user) return { isMember: false, hasPendingRequest: false };

    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("id, status")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          isMember: (data as { status: string }).status === "active",
          hasPendingRequest: (data as { status: string }).status === "pending"
        };
      }
      
      return { isMember: false, hasPendingRequest: false };
    } catch (error) {
      console.error("Error checking membership status:", error);
      return { isMember: false, hasPendingRequest: false };
    }
  };
  
  // Add a function to check if user has already joined this organization
  const checkUserMembership = async (orgId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      
      return !!data;
    } catch (error) {
      console.error("Error checking user membership:", error);
      return false;
    }
  };

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all approved organizations
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (orgError && orgError.code === 'PGRST205') {
        // Table doesn't exist, set empty organizations and return
        setOrganizations([]);
        return;
      }

      if (orgError) {
        console.error("Supabase error:", orgError);
        throw orgError;
      }

      // Get member counts and payment references for each organization
      const orgsWithCountsAndRefs = await Promise.all(
        (orgData || []).map(async (org: any) => {
          try {
            // Get member count
            const { count, error: countError } = await supabase
              .from("organization_members")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id)
              .limit(1);

            if (countError) {
              console.error("Error counting members:", countError);
              return { ...org, member_count: 0 };
            }

            // Get available payment references for this organization
            const { data: paymentRefs, error: refError } = await supabase
              .from("payment_references")
              .select("*")
              .eq("organization_id", org.id)
              .eq("used", false)
              .order("created_at", { ascending: false });

            if (refError) {
              console.error("Error fetching payment references:", refError);
            }

            // Check if user is member or has pending request for this org
            let membershipStatus = { isMember: false, hasPendingRequest: false };
            if (user) {
              membershipStatus = await checkMembershipStatus(org.id);
            }

            return {
              ...org,
              member_count: count || 0,
              payment_references: paymentRefs || [],
              ...membershipStatus
            };
          } catch (countError) {
            console.error("Error in member count query:", countError);
            return { ...org, member_count: 0 };
          }
        })
      );

      setOrganizations(orgsWithCountsAndRefs || [] as Organization[]);
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
      setIsUploadingImage(true);
      
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
      const orgPayload: any = {
        name: formData.name,
        description: formData.description,
        adviser_name: formData.adviser_name,
        club_type: formData.club_type,
        status: "pending",
        creator_id: user.id,
        primary_color: formData.primary_color || "#3b82f6",
        secondary_color: formData.secondary_color || "#1e40af",
      };

      // Upload background image if provided
      if (orgBackgroundImage) {
        const fileExt = orgBackgroundImage.name.split('.').pop();
        const fileName = `${user.id}-org-bg-${Date.now()}.${fileExt}`;
        const filePath = `organization-backgrounds/${fileName}`;
        
      // Upload to Supabase storage
const { error: uploadError } = await supabase
  .storage
  .from('organization-backgrounds' as any)
  .upload(filePath, orgBackgroundImage)
  .catch(() => ({ error: { message: 'Storage bucket not configured' } }));
        
        if (uploadError) {
          console.error("Error uploading background image:", uploadError);
          toast.warning("Background image upload failed, but organization will still be created");
        } else {
          // Get public URL
          const { data: urlData } = supabase
            .storage
            .from('organization-backgrounds' as any)
            .getPublicUrl(filePath);
          
          orgPayload.background_image = urlData.publicUrl;
        }
      }

      // Upload logo image if provided
      if (orgLogoImage) {
        const fileExt = orgLogoImage.name.split('.').pop();
        const fileName = `${user.id}-org-logo-${Date.now()}.${fileExt}`;
        const filePath = `organization-logos/${fileName}`;
        
        // Upload to Supabase storage
        const { error: uploadError } = await supabase
          .storage
          .from('organization-logos')
          .upload(filePath, orgLogoImage);
        
        if (uploadError) {
          console.error("Error uploading logo image:", uploadError);
          toast.warning("Logo image upload failed, but organization will still be created");
        } else {
          // Get public URL
          const { data: urlData } = supabase
            .storage
            .from('organization-logos')
            .getPublicUrl(filePath);
          
          orgPayload.logo_image = urlData.publicUrl;
        }
      }

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert(orgPayload)
        .select()
        .single() as { data: any; error: any };

      if (orgError) {
        console.error("Organization creation error:", orgError);
        throw orgError;
      }

      if (!orgData) {
        throw new Error("Organization data is null");
      }

      // Mark code as used
      await (supabase
        .from("registration_codes") as any)
        .update({ used: true })
        .eq("id", (codeData as any).id);

      // Add creator as member with creator role
      await supabase
        .from("organization_members")
        .insert([{
          organization_id: orgData.id,
          user_id: user.id,
          role: "creator",
        }]);

      toast.success("Organization registration submitted for approval!");
      setIsRegisterModalOpen(false);
      fetchOrganizations();
      resetForm();
      setOrgBackgroundImage(null);
      setOrgLogoImage(null);
    } catch (error) {
      console.error("Error registering organization:", error);
      toast.error("Failed to register organization. Please check your registration code.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdateOrganization = async () => {
    if (!user || !editingOrgId) {
      toast.error("Please log in to update an organization");
      return;
    }

    try {
      setIsEditing(true);
      
      const orgPayload: any = {
        id: editingOrgId,
        name: editFormData.name,
        description: editFormData.description,
        adviser_name: editFormData.adviser_name,
        club_type: editFormData.club_type,
        primary_color: editFormData.primary_color,
        secondary_color: editFormData.secondary_color,
        updated_at: new Date().toISOString(),
      };

      // Upload logo image if provided
      if (editLogoImage) {
        try {
          const fileExt = editLogoImage.name.split('.').pop();
          const fileName = `${user.id}-org-logo-${Date.now()}.${fileExt}`;
          const filePath = `organization-logos/${fileName}`;
          
          // Upload to Supabase storage
          const { error: uploadError } = await supabase
            .storage
            .from('organization-logos')
            .upload(filePath, editLogoImage);
          
          if (uploadError) {
            console.error("Error uploading logo image:", uploadError);
            toast.error("Logo upload failed. Please contact admin to set up storage bucket.");
          } else {
            // Get public URL
            const { data: urlData } = supabase
              .storage
              .from('organization-logos')
              .getPublicUrl(filePath);
            
            // Update organization with logo URL (only update logo, skip color fields)
            const { error: orgError } = await supabase
              .from("organizations")
              .update({
                logo_image: urlData.publicUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("id", editingOrgId)
              .select();
            
            if (orgError) {
              console.error("Organization update error:", orgError);
              toast.error("Failed to update organization: " + (orgError.message || "Unknown error"));
            } else {
              toast.success("Logo updated successfully!");
            }
          }
        } catch (error) {
          console.error("Error in logo upload process:", error);
          toast.error("Logo upload failed. Please try again or contact support.");
        }
      }
      
      // Update organization details if no logo was uploaded or after logo upload
      if (!editLogoImage) {
        // In handleUpdateOrganization, change the update payload to:
const { error: detailsError } = await supabase
  .from("organizations")
  .update({
    name: editFormData.name,
    description: editFormData.description,
    adviser_name: editFormData.adviser_name,
    club_type: editFormData.club_type,
    updated_at: new Date().toISOString(),
  })
  .eq("id", editingOrgId);

        if (detailsError) {
          console.error("Organization update error:", detailsError);
          toast.error("Failed to update organization: " + detailsError.message);
          throw detailsError;
        }
      } else {
        // If logo was uploaded, update the other fields separately
        const { error: detailsError } = await supabase
          .from("organizations")
          .update({
            name: editFormData.name,
            description: editFormData.description,
            adviser_name: editFormData.adviser_name,
            club_type: editFormData.club_type,
            primary_color: editFormData.primary_color,
            secondary_color: editFormData.secondary_color,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingOrgId);

        if (detailsError) {
          console.error("Organization update error:", detailsError);
          toast.error("Failed to update organization details: " + detailsError.message);
          throw detailsError;
        }
      }

      toast.success("Organization updated successfully!");
      setEditingOrgId(null);
      fetchOrganizations();
      setEditLogoImage(null);
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Failed to update organization. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      adviser_name: "",
      club_type: "Academic",
      primary_color: "#3b82f6",
      secondary_color: "#1e40af",
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

                {/* Background Image Upload */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Organization Background Image (Optional)</h3>
                  <div className="flex items-center gap-4">
                    {orgBackgroundImage ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(orgBackgroundImage)}
                          alt="Preview"
                          className="w-32 h-20 object-cover rounded-lg border"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => setOrgBackgroundImage(null)}
                          title="Remove image"
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
                      <div className="flex gap-2">
                        <Input
                          id="background-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setOrgBackgroundImage(file);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 flex-1"
                          disabled={isUploadingImage}
                          onClick={() => document.getElementById('background-image-upload')?.click()}
                        >
                          {isUploadingImage ? "Uploading..." : "Upload Background Image"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload an image that will be used as the background for your organization
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logo Image Upload */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Organization Logo (Optional)</h3>
                  <div className="flex items-center gap-4">
                    {orgLogoImage ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(orgLogoImage)}
                          alt="Logo Preview"
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => setOrgLogoImage(null)}
                          title="Remove logo"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg border flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">No logo</p>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <Input
                          id="logo-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setOrgLogoImage(file);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 flex-1"
                          disabled={isUploadingImage}
                          onClick={() => document.getElementById('logo-image-upload')?.click()}
                        >
                          {isUploadingImage ? "Uploading..." : "Upload Logo Image"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload an image that will be used as the logo for your organization (recommended: square format)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Organization Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-12 h-10 p-0"
                        />
                        <Input
                          type="text"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="w-12 h-10 p-0"
                        />
                        <Input
                          type="text"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleRegisterOrganization} className="w-full" disabled={isUploadingImage || !registrationCode || !formData.name || !formData.description || !formData.club_type}>
                  {isUploadingImage ? "Processing..." : "Submit for Approval"}
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
              const isCreator = user?.id === org.creator_id;
              
              return (
                <Card
                  key={org.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  style={org.primary_color ? {
                    borderTop: `4px solid ${org.primary_color}`,
                    boxShadow: `0 0 0 1px ${org.primary_color}20`
                  } : undefined}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {org.logo_image && (
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={org.primary_color ? {
                            borderColor: org.primary_color
                          } : undefined}>
                            <img
                              src={org.logo_image}
                              alt={org.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg" style={org.primary_color ? {
                            color: org.primary_color
                          } : undefined}>
                            {org.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={org.primary_color ? {
                              backgroundColor: org.primary_color
                            } : undefined}></span>
                            {org.club_type}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={isApproved ? "default" : "secondary"}>
                        {org.club_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{org.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
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
                                {org.payment_references && org.payment_references.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3 text-blue-500" />
                                    <span>{org.payment_references.length} available slots</span>
                                  </div>
                                )}
                              </div>
                    {isApproved && !org.isMember && !org.hasPendingRequest && org.payment_references && org.payment_references.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="space-y-1">
                          {org.payment_references.map((ref: any) => (
                            <div key={ref.id} className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                              <p className="text-xs font-medium text-blue-800">Payment Reference: {ref.reference_code}</p>
                              <p className="text-[10px] text-blue-700">Pay ₱{Number(ref.amount || 0).toFixed(2)} to join</p>
                            </div>
                          ))}
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
                      </div>
                    )
                    {isApproved && !org.isMember && !org.hasPendingRequest && (!org.payment_references || org.payment_references.length === 0) && (
                      <div className="mt-3 space-y-2">
                        <div className="space-y-2">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                            <p className="text-xs font-medium text-yellow-800">No payment references available for this organization</p>
                          </div>
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
                      </div>
                    )
                    {isApproved && org.isMember && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/organizations/${org.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" /> Explore Organization
                        </Button>
                      </div>
                    )}
                    {isApproved && org.hasPendingRequest && (
                      <div className="mt-3">
                        <Badge variant="secondary" className="gap-1 w-full justify-center">
                          <AlertCircle className="h-3 w-3" /> Pending Approval
                        </Badge>
                      </div>
                    )}
                    {isCreator && org.status === "approved" && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOrgId(org.id);
                            setEditFormData({
                              name: org.name,
                              description: org.description,
                              adviser_name: org.adviser_name || "",
                              club_type: org.club_type,
                              primary_color: org.primary_color || "#3b82f6",
                              secondary_color: org.secondary_color || "#1e40af",
                            });
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          </div>
        )
      })}
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

      {/* Edit Organization Dialog */}
      {editingOrgId && (
        <Dialog open={!!editingOrgId} onOpenChange={() => setEditingOrgId(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription>
                Update your organization details and colors.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-org-name">Organization Name *</Label>
                <Input
                  id="edit-org-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g., Computer Science Club"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-org-description">Description *</Label>
                <Input
                  id="edit-org-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Brief description of your organization"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-org-adviser">Adviser Name (Optional)</Label>
                <Input
                  id="edit-org-adviser"
                  value={editFormData.adviser_name}
                  onChange={(e) => setEditFormData({ ...editFormData, adviser_name: e.target.value })}
                  placeholder="e.g., Mr. Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-org-type">Club Type *</Label>
                <Select value={editFormData.club_type} onValueChange={(value) => setEditFormData({ ...editFormData, club_type: value })}>
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

              {/* Logo Image Upload for Edit */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Update Organization Logo (Optional)</h3>
                <div className="flex items-center gap-4">
                {editLogoImage ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(editLogoImage)}
                      alt="Logo Preview"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => setEditLogoImage(null)}
                      title="Remove logo"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg border flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">No logo</p>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex gap-2">
                    <Input
                      id="edit-logo-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditLogoImage(file);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 flex-1"
                      disabled={isEditing}
                      onClick={() => document.getElementById('edit-logo-image-upload')?.click()}
                    >
                      {isEditing ? "Uploading..." : "Upload New Logo Image"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload a new logo image for your organization (recommended: square format)
                  </p>
                </div>
              </div>
              </div>

              {/* Color Selection for Edit */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Organization Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-primary-color">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="edit-primary-color"
                        type="color"
                        value={editFormData.primary_color}
                        onChange={(e) => setEditFormData({ ...editFormData, primary_color: e.target.value })}
                        className="w-12 h-10 p-0"
                      />
                      <Input
                        type="text"
                        value={editFormData.primary_color}
                        onChange={(e) => setEditFormData({ ...editFormData, primary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-secondary-color">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="edit-secondary-color"
                        type="color"
                        value={editFormData.secondary_color}
                        onChange={(e) => setEditFormData({ ...editFormData, secondary_color: e.target.value })}
                        className="w-12 h-10 p-0"
                      />
                      <Input
                        type="text"
                        value={editFormData.secondary_color}
                        onChange={(e) => setEditFormData({ ...editFormData, secondary_color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingOrgId(null)}
                  disabled={isEditing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateOrganization}
                  className="flex-1"
                  disabled={isEditing || !editFormData.name || !editFormData.description || !editFormData.club_type}
                >
                  {isEditing ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
