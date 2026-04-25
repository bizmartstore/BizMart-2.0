"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Check, X, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JoinRequest {
  id: string;
  organization_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  joined_at: string;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export default function JoinRequestsTab() {
  const { user } = useAuth();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    if (user) {
      fetchJoinRequests();
    }
  }, [user, filter]);

  const fetchJoinRequests = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from("organization_members")
        .select(`
          id,
          organization_id,
          user_id,
          status,
          joined_at,
          profile:user_id(id, first_name, last_name, email, avatar_url),
          organization:organization_id(id, name)
        `)
        .order("joined_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted: JoinRequest[] = (data || []).map((req: any) => ({
        id: req.id,
        organization_id: req.organization_id,
        user_id: req.user_id,
        status: req.status,
        joined_at: req.joined_at,
        profile: req.profile
          ? {
              id: req.profile.id,
              first_name: req.profile.first_name,
              last_name: req.profile.last_name,
              email: req.profile.email,
              avatar_url: req.profile.avatar_url ?? undefined,
            }
          : undefined,
        organization: req.organization
          ? {
              id: req.organization.id,
              name: req.organization.name,
            }
          : undefined,
      }));

      setJoinRequests(formatted);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      toast.error("Failed to load join requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const request = joinRequests.find((req) => req.id === requestId);
      if (!request) return;

      // First, update the member status to active
      const { error: memberError } = await supabase
        .from("organization_members")
        .update({ status: "active" })
        .eq("id", requestId);

      if (memberError) throw memberError;

      // Add fee to organization wallet using the organization's declared join_fee
      if (request.organization?.id) {
        try {
          // Get the organization's join fee
          const { data: orgData, error: orgError } = await supabase
            .from("organizations")
            .select("join_fee")
            .eq("id", request.organization.id)
            .maybeSingle();

          if (orgError) {
            console.error("Error fetching organization join fee:", orgError);
            toast.error("Failed to fetch join fee");
          } else {
            const joinFee = (orgData as { join_fee?: number })?.join_fee || 0;

            if (joinFee > 0) {
              try {
                // Create a pending transaction first
                const { error: transactionError } = await supabase
                  .from("organization_transactions")
                  .insert([{
                    organization_id: request.organization.id,
                    user_id: request.user_id,
                    type: "deposit",
                    amount: joinFee,
                    status: "pending",
                    purpose: `Organization join fee: ${request.organization.name}`,
                    reference: `Join fee payment by ${request.profile?.first_name || ''} ${request.profile?.last_name || ''}`,
                    gcash_fee: 0,
                  }]);

                if (transactionError) {
                  console.error("Error creating pending transaction:", transactionError);
                  toast.error("Failed to create transaction record");
                } else {
                  toast.success("Join request approved! A deposit transaction has been created and is pending admin approval.");
                  
                  // Now approve the transaction automatically (since this is admin-initiated)
                  const { data: transactionData } = await supabase
                    .from("organization_transactions")
                    .select("*")
                    .eq("organization_id", request.organization.id)
                    .eq("user_id", request.user_id)
                    .eq("status", "pending")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                  if (transactionData) {
                    // Approve the transaction
                    await supabase
                      .from("organization_transactions")
                      .update({ status: "approved" })
                      .eq("id", transactionData.id);

                    // Update wallet balance
                    const { data: walletData, error: walletError } = await supabase
                      .from("organization_wallets")
                      .select("balance")
                      .eq("organization_id", request.organization.id)
                      .maybeSingle();

                    if (walletError) throw walletError;

                    let currentBalance = walletData?.balance || 0;
                    const newBalance = currentBalance + joinFee;

                    let walletUpdated = false;

                    if (walletData) {
                      // Wallet exists, update it
                      const { error: updateError } = await supabase
                        .from("organization_wallets")
                        .update({ balance: newBalance })
                        .eq("organization_id", request.organization.id);

                      if (updateError) {
                        console.error("Error updating wallet balance:", updateError);
                        toast.error("Failed to update wallet balance");
                      } else {
                        walletUpdated = true;
                      }
                    } else {
                      // Wallet doesn't exist, create it
                      const { error: createError } = await supabase
                        .from("organization_wallets")
                        .insert({
                          organization_id: request.organization.id,
                          balance: joinFee,
                        });

                      if (createError) {
                        console.error("Error creating wallet:", createError);
                        toast.error("Failed to create organization wallet");
                      } else {
                        walletUpdated = true;
                      }
                    }

                    if (walletUpdated) {
                      toast.success("Transaction approved! Organization wallet has been updated with the join fee.");
                    }
                  }
                }
              } catch (error) {
                console.error("Error processing join fee payment:", error);
                toast.error("Failed to process join fee payment");
              }
            }
          }
        } catch (error) {
          console.error("Error processing join fee for organization:", error);
          toast.error("Failed to process join fee - organization wallet may not be updated");
        }
      } else {
        toast.success("Join request approved!");
      }

      fetchJoinRequests();
    } catch (error) {
      console.error("Error approving join request:", error);
      toast.error("Failed to approve join request");
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("organization_members")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Join request rejected.");
      fetchJoinRequests();
    } catch (error) {
      console.error("Error rejecting join request:", error);
      toast.error("Failed to reject join request");
    }
  };

  const filteredRequests = joinRequests.filter((req) => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" /> Join Requests
        </h2>

        <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredRequests.length === 0
          ? "No join requests found."
          : `${filteredRequests.length} join request(s) found.`}
      </p>

      {filteredRequests.length > 0 && (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {request.profile?.first_name?.charAt(0) || "U"}
                        {request.profile?.last_name?.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <CardTitle className="text-lg">
                        {request.profile?.first_name} {request.profile?.last_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {request.profile?.email}
                      </CardDescription>
                    </div>
                  </div>

                  <Badge
                    variant={
                      request.status === "pending"
                        ? "secondary"
                        : request.status === "approved"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>
                    <strong>Organization:</strong> {request.organization?.name || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    <strong>Requested:</strong>{" "}
                    {new Date(request.joined_at).toLocaleString()}
                  </span>
                </div>

                {request.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(request.id)}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>

                    <Button
                      size="sm"
                      className="flex-1 gap-2 bg-destructive hover:bg-destructive/90"
                      onClick={() => handleReject(request.id)}
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
  );
}