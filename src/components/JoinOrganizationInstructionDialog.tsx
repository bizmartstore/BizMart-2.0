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
import { AlertCircle, CheckCircle2, CreditCard } from "lucide-react";

interface JoinOrganizationInstructionDialogProps {
  organizationId: string;
  organizationName: string;
  fee: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function JoinOrganizationInstructionDialog({
  organizationId,
  organizationName,
  fee,
  isOpen,
  onOpenChange,
  onSuccess,
}: JoinOrganizationInstructionDialogProps) {
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSubmitRequest = async () => {
    if (!user) {
      toast.error("Please log in to join the organization");
      return;
    }

    setIsConfirming(true);

    try {
      // Insert join request directly without payment verification
      const { error } = await (supabase
        .from("organization_members") as any)
        .insert([{
          organization_id: organizationId,
          user_id: user.id,
          role: "member",
          status: "pending",
        }]);

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
            Submit your request to join the organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Join Request</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                Your request will be sent to the organization admin for approval.
                {fee > 0 && (
                  <>
                    <br />
                    <strong>Note:</strong> A fee of ₱{fee.toFixed(2)} will be added to the organization's wallet balance upon approval.
                  </>
                )}
              </p>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleSubmitRequest}
            disabled={isConfirming}
            className="w-full gap-2"
          >
            {isConfirming ? "Submitting Request..." : "Submit Join Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}