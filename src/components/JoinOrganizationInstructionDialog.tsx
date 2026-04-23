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

    if (!referenceNumber) {
      toast.error("Please enter your payment reference number");
      return;
    }

    setIsConfirming(true);

    try {
      // Verify the payment reference exists and is not used
      // Any generated payment reference can be used to join any organization
      const { data: paymentRef, error: refError } = await supabase
        .from("payment_references")
        .select("*")
        .eq("reference_code", referenceNumber)
        .eq("used", false)
        .maybeSingle();

      if (refError) {
        console.error("Error verifying payment reference:", refError);
        toast.error("Error verifying payment reference");
        return;
      }

      if (!paymentRef) {
        toast.error("Invalid or already used payment reference number. Please check and try again.");
        return;
      }

      // Verify the payment reference belongs to the organization being joined
      if (paymentRef.organization_id !== organizationId) {
        toast.error("This payment reference number is for a different organization. Please use the correct reference number for this organization.");
        return;
      }

      // Insert join request
      const { error } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          role: "member",
          status: "pending",
          reference_code: referenceNumber,
        });

      if (error) throw error;

      // Mark payment reference as used
      if (paymentRef && paymentRef.id) {
        try {
          await supabase
            .from("payment_references")
            .update({
              used: true,
              used_by: user.id,
              used_at: new Date().toISOString(),
            })
            .eq("id", paymentRef.id);
        } catch (error) {
          console.error("Error marking payment reference as used:", error);
        }
      }

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
                Go to the <strong>BizMart Store</strong> and pay the organization fee.
                <br />
                Save your payment reference number for verification.
              </p>
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Step 2: Submit Your Join Request</AlertTitle>
            <AlertDescription>
              <p className="text-sm">
                After paying, submit this form to request joining the organization.
                <br />
                The organization admin will review your payment and approve your request.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reference-number">Payment Reference Number</Label>
            <Input
              id="reference-number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter your payment reference number from BizMart Store"
              required
            />
            <p className="text-xs text-muted-foreground">
              This will help the admin verify your payment.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <Label htmlFor="paid-confirmation" className="font-normal cursor-pointer">
              I have paid the organization fee and have the reference number
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
            disabled={!hasPaid || !referenceNumber || isConfirming}
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