"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Shield, AlertCircle } from "lucide-react";
import AtmCardLinkForm from "@/components/AtmCardLinkForm";
import AtmCardList from "@/components/AtmCardList";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AtmCardManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Please Login</h2>
        <p className="text-muted-foreground mb-6">You need to be logged in to manage your ATM cards.</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />

      <div className="px-4 py-4">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => navigate(-1)} className="p-1.5">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">ATM Card Management</h1>
            <p className="text-xs text-muted-foreground">Link and manage your ATM cards for bCoins redemption</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Security Notice */}
          <Card className="border border-border shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold">Security Notice</CardTitle>
              </div>
              <CardDescription>
                Your ATM card information is securely stored and encrypted. We never store your full card number.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Your card details are encrypted and secure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Only the last 4 digits are displayed for security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Your data is protected with industry-standard encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span>We never share your card details with third parties</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Link New Card Form */}
          <AtmCardLinkForm onSuccess={() => setRefreshTrigger(prev => prev + 1)} />

          {/* Linked Cards List */}
          <AtmCardList onCardUnlinked={() => setRefreshTrigger(prev => prev + 1)} />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}