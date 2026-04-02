"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Check, CheckCheck, RefreshCw, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bcoins, setBcoins] = useState<number>(0); // NEW: BCoins balance

  // Load profile and BCoins balance
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // 1️⃣ Fetch profile data
    const { data: profileData, error: profileError } = supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      setLoading(false);
      return;
    }

    // 2️⃣ Fetch BCoins balance from bcoins_wallets    const { data: walletData, error: walletError } = supabase
      .from('bcoins_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!walletError) {
      setBcoins(walletData?.balance ?? 0);
    }

    setProfile(profileData as any);
    setLoading(false);
  }, [user]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Use the fetched balance directly in the UI
  const balance = bcoins;

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9 text-sm h-9 rounded-xl"
          />
        </div>
      </div>

      {/* Profile Display */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight">{profile?.first_name} {profile?.last_name}</div>
            <p className="text-sm text-muted-foreground">{profile?.school} • {profile?.grade_level} - {profile?.section}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        {/* BCoins Display */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold">BCoins</span>
          <span className="text-sm font-bold text-primary">{balance.toFixed(1)}</span>
        </div>
      </div>

      {/* My Info Fields */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        <div className="bg-card rounded-xl border border-border p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted rounded-lg p-1.5">
              <span className="text-sm font-bold">🪙</span>
              <span className="text-sm font-bold">{balance.toFixed(1)}</span>
            </div>
            <div className="bg-muted rounded-lg p-1.5">
              <span className="text-sm font-bold">School</span>
              <p className="text-[10px] text-muted-foreground">{profile?.school}</p>
            </div>
            <div className="bg-muted rounded-lg p-1.5">
              <span className="text-sm font-bold">Grade</span>
              <p className="text-[10px] text-muted-foreground">{profile?.grade_level}</p>
            </div>
            <div className="bg-muted rounded-lg p-1.5">
              <span className="text-sm font-bold">Section</span>
              <p className="text-[10px] text-muted-foreground">{profile?.section}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Section */}
      <div className="bg-card rounded-xl p-3 border border-border space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[10px]">First Name</Label><Input value={profile?.first_name || ""} onChange={e => setProfile({...profile, first_name: e.target.value})} placeholder="John" className="text-sm" /></div>
          <div><Label className="text-[10px]">Last Name</Label><Input value={profile?.last_name || ""} onChange={e => setProfile({...profile, last_name: e.target.value})} placeholder="Doe" className="text-sm" /></div>
          <div><Label className="text-[10px]">Email</Label><Input value={profile?.email || ""} onChange={e => setProfile({...profile, email: e.target.value})} placeholder="john@school.edu" className="text-sm" /></div>
          <div><Label className="text-[10px]">Password</Label><Input type="password" value={profile?.password || ""} onChange={e => setProfile({...profile, password: e.target.value})} placeholder="••••••" className="text-sm" /></div>
          <div><Label className="text-[10px]">New Password (optional)</Label><Input type="password" value={profile?.password || ""} onChange={e => setProfile({...profile, password: e.target.value})} placeholder="••••••" className="text-sm" /></div>
          <Button onClick={() => setProfile(profile)} className="w-full gap-1">Cancel</Button>
          <Button onClick={() => {
            // Simple password change logic (no backend call in this snippet)
            setProfile(profile);
          }} className="w-full gap-1">Save</Button>
        </div>
      </div>

      <div className="space-y-3">
        {/* ... existing profile info sections ... */}
      </div>

      <BottomNav />
    </div>
  );
}