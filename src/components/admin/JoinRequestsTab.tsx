"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Check, X, User, Calendar, CreditCard } from "lucide-react";
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
  reference_number?: string;
  created_at: string;
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

      const { data, error } = await supabase
        .from("organization_members")
        .select("*, profile:user_id(*), organization:organization_id(*), reference_number")
        .eq("status", filter === "all" ? undefined : filter)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setJoinRequests((data as JoinRequest[]) || []);
    } catch (error) {
      console.error("Error fetching join requests:", error);
      toast.error("Failed to load join requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      // Fetch the join request details
      const { data: requestData, error: fetchError } = await supabase
        .from("organization_members")
        .select("organization_id, user_id, reference_number")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!requestData) throw new Error("Join request not found");

      // Insert the user as a member with status "active"
      const { error: insertError } = await supabase
        .from("organization_members")
        .insert([{
          organization_id: requestData.organization_id,
          user_id: requestData.user_id,
          role: "member",
          status: "active",
          reference_number: requestData.reference_number || null,
        }]);

      if (insertError) throw insertError;

      // Update the original join request status to "approved"
      const { error: updateError } = await supabase
        .from("organization_members")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      toast.success("Join request approved!");
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

      {filteredRequests.length > 0 ? (
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
                    variant={request.status === "pending" ? "secondary" : request.status === "approved" ? "default" : "destructive"}
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
                {request.reference_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4" />
                    <span>
                      <strong>Reference:</strong> {request.reference_number}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    <strong>Requested:</strong> {new Date(request.created_at).toLocaleString()}
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
      ) : null}
    </div>
  );
}