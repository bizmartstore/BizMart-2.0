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
  const [hasPaid, setHasPaid] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");

  const handleSubmitRequest = async () => {
    if (!user) {
      toast.error("Please log in to join the organization");
      return;
    }

    if (!hasPaid) {
      toast.error("Please confirm that you have paid the organization fee");
      return;
    }

    setIsConfirming(true);

    try {
      // Insert join request
      const { error } = await (supabase
        .from("organization_members") as any)
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          role: "member",
          status: "pending",
          reference_number: referenceNumber || undefined,
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
            Follow these steps to join the organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Step 1: Pay the Organization Fee</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                Go to the <strong>BizMart Store</strong> and pay the organization fee of ₱500.
                <br />
                Save your payment reference number.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reference-number">Payment Reference Number (Optional)</Label>
            <Input
              id="reference-number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter your payment reference number"
            />
          </div>

          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Step 2: Confirm Payment</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                After paying, check the box below to confirm you have completed the payment.
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <Label htmlFor="paid-confirmation" className="font-normal cursor-pointer">
              I have paid the organization fee of ₱500
            </Label>
            <Input
              id="paid-confirmation"
              type="checkbox"
              checked={hasPaid}
              onChange={(e) => setHasPaid(e.target.checked)}
              className="ml-auto"
            />
          </div>

          <Button
            onClick={handleSubmitRequest}
            disabled={!hasPaid || isConfirming}
            className="w-full gap-2"
          >
            <CreditCard className="h-4 w-4" />
            {isConfirming ? "Submitting Request..." : "Submit Join Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}