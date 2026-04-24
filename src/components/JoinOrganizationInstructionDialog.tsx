"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Users } from "lucide-react";

interface JoinOrganizationInstructionDialogProps {
  organizationId: string;
  organizationName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function JoinOrganizationInstructionDialog({
  organizationId,
  organizationName,
  isOpen,
  onOpenChange,
  onSuccess,
}: JoinOrganizationInstructionDialogProps) {
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleSubmitRequest = async () => {
    if (!user) {
      toast.error("Please log in to join the organization");
      return;
    }

    if (!isChecked) {
      toast.error("Please confirm that you want to join the organization");
      return;
    }

    setIsConfirming(true);

    try {
      // Insert join request
      const { error } = await supabase
        .from("organization_members" as any)
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          role: "member",
          status: "pending",
        });

      if (error) throw error;

      toast.success("Your request to join has been submitted! Please wait for admin approval.");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting join request:", error);
      toast.error("Failed to submit join request. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Join {organizationName}</DialogTitle>
          <DialogDescription>
            Follow the steps below to join the organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Step 1: Review Organization Details</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                Make sure this is the organization you want to join.
              </p>
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Step 2: Submit Your Join Request</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                The organization admin will review your request and approve it.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <Label htmlFor="join-confirmation" className="font-normal cursor-pointer">
              I understand that my request needs admin approval to join this organization
            </Label>
            <Input
              id="join-confirmation"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="ml-auto"
            />
          </div>

          <Button
            onClick={handleSubmitRequest}
            disabled={!isChecked || isConfirming}
            className="w-full gap-2"
          >
            <Users className="h-4 w-4" />
            {isConfirming ? "Submitting Request..." : "Submit Join Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
