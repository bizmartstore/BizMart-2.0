"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Coins, AlertCircle, CheckCircle, Clock, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Event, EventMember } from "@/types";

interface EventDetailModalProps {
  event: Event | null;
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EventDetailModal({
  event,
  organizationId,
  isOpen,
  onOpenChange,
  onSuccess,
}: EventDetailModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [eventMembers, setEventMembers] = useState<EventMember[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    if (event && user) {
      checkEventStatus();
      loadEventMembers();
    }
  }, [event, user]);

  const checkEventStatus = async () => {
    if (!event || !user) return;

    try {
      const { data, error } = await supabase
        .from("event_members")
        .select("*")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasPendingRequest(data.status === "pending");
        setHasJoined(data.status === "approved" || data.status === "joined");
      }
    } catch (error) {
      console.error("Error checking event status:", error);
    }
  };

  const loadEventMembers = async () => {
    if (!event) return;

    try {
      const { data, error } = await supabase
        .from("event_members")
        .select(`*, profiles:user_id(first_name, last_name, email, avatar_url)`)
        .eq("event_id", event.id)
        .eq("status", "approved")
        .order("joined_at", { ascending: true });

      if (error) throw error;

      setEventMembers(data || []);
    } catch (error) {
      console.error("Error loading event members:", error);
    }
  };

  const handleRequestToJoin = async () => {
    if (!event || !user) return;

    try {
      setIsLoading(true);

      // Check if event is free
      if (event.fee === 0) {
        // Auto-join for free events
        const { error } = await supabase
          .from("event_members")
          .insert([{
            event_id: event.id,
            user_id: user.id,
            status: "joined",
            joined_at: new Date().toISOString(),
          }]);

        if (error) throw error;

        toast.success("Successfully joined the event!");
        setHasJoined(true);
        onSuccess?.();
        return;
      }

      // For paid events, create a pending request
      const { error } = await supabase
        .from("event_members")
        .insert([{
          event_id: event.id,
          user_id: user.id,
          status: "pending",
          joined_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast.success(
        "Your request to join has been submitted! Please go to the BizMart store to pay the event fee before admin can approve your request."
      );
      setHasPendingRequest(true);
      onSuccess?.();
    } catch (error) {
      console.error("Error requesting to join event:", error);
      toast.error("Failed to request to join event");
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{event.name}</DialogTitle>
          <DialogDescription>
            {event.description || "No description provided"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className="text-sm">
                  {event.deadline ? new Date(event.deadline).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Capacity</p>
                <p className="text-sm">
                  {eventMembers.length}/{event.capacity} members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fee</p>
                <p className="text-sm">₱{event.fee.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={
                  event.status === "upcoming"
                    ? "default"
                    : event.status === "ongoing"
                    ? "secondary"
                    : "outline"
                }
              >
                {event.status === "upcoming"
                  ? "Upcoming"
                  : event.status === "ongoing"
                  ? "Ongoing"
                  : "Completed"}
              </Badge>
            </div>
          </div>

          {/* Action Button */}
          {!hasJoined && !hasPendingRequest && (
            <Button
              onClick={handleRequestToJoin}
              disabled={isLoading || event.status !== "upcoming"}
              className="w-full gap-2"
            >
              {isLoading ? "Processing..." : <UserPlus className="h-4 w-4" />}
              {event.fee === 0 ? "Join Event" : "Request to Join"}
            </Button>
          )

          {hasPendingRequest && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Your request is pending approval. Please pay at BizMart store.
                </p>
              </div>
            </div>
          )

          {hasJoined && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">You have joined this event!</p>
              </div>
            </div>
          )

          {event.status !== "upcoming" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">This event is no longer accepting new members.</p>
              </div>
            </div>
          )

          {/* Members List */}
          {eventMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Members ({eventMembers.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-40 overflow-y-auto">
                {eventMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {member.profiles?.first_name?.charAt(0) || "U"}
                        {member.profiles?.last_name?.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.profiles?.email}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        </div>
      </DialogContent>
    </Dialog>
  );
}