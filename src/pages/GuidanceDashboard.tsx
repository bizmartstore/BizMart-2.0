"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import SupportTab from "@/components/admin/SupportTab";
import AdminMessagesTab from "@/components/admin/AdminMessagesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, MessageSquare, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function GuidanceDashboard() {
  const { user, profile, signOut, isAuthReady } = useAuth();
  const { isGuidance } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthReady && !isGuidance) {
      navigate("/");
    }
  }, [isAuthReady, isGuidance, navigate]);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (!isAuthReady || !isGuidance) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-black text-2xl text-foreground">Guidance Hub</h1>
            <p className="text-xs text-muted-foreground">Welcome, {profile?.first_name} • Authorized Personnel</p>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-6 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="reports" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Reports
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <SupportTab />
          </TabsContent>
          
          <TabsContent value="messages">
            <AdminMessagesTab />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}