"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Search, Plus, UserPlus, CheckCircle2, AlertCircle, Eye, X } from "lucide-react";
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
          { event: 'UPDATE', schema: 'public', table: 'organizations' },
          () => {
            fetchOrganizations();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(paymentRefsChannel);
        supabase.removeChannel(orgsChannel);
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
            // 🔹 MEMBER COUNT
            const { count, error: countError } = await supabase
              .from("organization_members")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id);

            if (countError) {
              console.error("Error counting members:", countError);
            }

            // 🔹 AVAILABLE SLOTS (SAFE FOR CUSTOMERS)
            const { count: availableSlots, error: slotError } = await supabase
              .from("payment_references")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", org.id)
              .eq("used", false);

            if (slotError) {
              console.error("Error fetching slots:", slotError);
            }

            // 🔹 PAYMENT REFERENCES (ADMIN ONLY VIA RLS)
            const { data: paymentRefs, error: refError } = await supabase
              .from("payment_references")
              .select("*")
              .eq("organization_id", org.id)
              .order("created_at", { ascending: false });

            if (refError) {
              console.error("Error fetching payment references:", refError);
            }

            // 🔹 MEMBERSHIP STATUS
            let membershipStatus = {
              isMember: false,
              hasPendingRequest: false,
            };

            if (user) {
              membershipStatus = await checkMembershipStatus(org.id);
            }

            // 🔹 FINAL RETURN
            return {
              ...org,
              member_count: count || 0,
              payment_references: paymentRefs || [],
              available_slots: availableSlots || 0,
              ...membershipStatus,
            };

          } catch (error) {
            console.error("Error processing organization:", error);

            return {
              ...org,
              member_count: 0,
              payment_references: [],
              available_slots: 0,
              isMember: false,
              hasPendingRequest: false,
            };
          }
        })
      );

      // ✅ SET STATE (ONLY ONCE — CLEAN)
      setOrganizations(orgsWithCountsAndRefs as Organization[]);

    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]);
      toast.error("Failed to load organizations. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of the component...
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
        </div>
      </div>
      <BottomNav />
    </div>
  );
}