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
      // Check both registration_codes and payment_references tables
      let refData = null;
      let refError = null;
      let tableName = "";

      // First, check payment_references table
      const { data: paymentRefData, error: paymentRefError } = await supabase
        .from("payment_references")
        .select("*")
        .eq("reference_code", referenceNumber)
        .eq("used", false)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (paymentRefError) {
        console.error("Error verifying payment reference in payment_references:", paymentRefError);
      }

      if (paymentRefData) {
        refData = paymentRefData;
        tableName = "payment_references";
      } else {
        // If not found in payment_references, check registration_codes table
        const { data: regCodeData, error: regCodeError } = await supabase
          .from("registration_codes")
          .select("*")
          .eq("code", referenceNumber)
          .eq("used", false)
          .maybeSingle();

        if (regCodeError) {
          console.error("Error verifying registration code:", regCodeError);
        }

        if (regCodeData) {
          refData = regCodeData;
          tableName = "registration_codes";
        }
      }

      if (!paymentRefData && !regCodeData) {
        toast.error("Invalid or already used payment reference number. Please check and try again.");
        return;
      }

      // Insert join request
      const { error } = await supabase
        .from("organization_members" as any)
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          role: "member",
          status: "pending",
          reference_code: referenceNumber,
        });

      if (error) throw error;

      // Mark the reference as used in the appropriate table
      if (paymentRefData && paymentRefData.id) {
        try {
          await supabase
            .from("payment_references")
            .update({
              used: true,
              used_by: user.id,
              used_at: new Date().toISOString(),
            })
            .eq("id", paymentRefData.id);
        } catch (error) {
          console.error("Error marking payment reference as used:", error);
        }
      } else if (regCodeData && regCodeData.id) {
        try {
          await supabase
            .from("registration_codes")
            .update({
              used: true,
            })
            .eq("id", regCodeData.id);
        } catch (error) {
          console.error("Error marking registration code as used:", error);
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