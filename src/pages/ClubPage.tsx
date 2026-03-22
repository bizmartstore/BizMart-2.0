import { Crown, Download, Shield, Store, Sparkles, ArrowRight, FileText } from "lucide-react";
import { notifyAdminNewMember } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ClubPage() {
  const { user, profile } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    motivation: "",
    commitment: "",
  });

  useEffect(() => {
    if (!user) return;
    const checkMembership = async () => {
      const { data } = await supabase
        .from("club_memberships")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      setIsMember(!!data);
    };
    checkMembership();
  }, [user]);

  const handleApply = async () => {
    if (!user) return;
    setIsApplying(true);
    try {
      const { error } = await supabase
        .from("club_memberships")
        .insert({
          user_id: user.id,
          motivation: applicationData.motivation,
          commitment: applicationData.commitment,
          status: "pending",
        });

      if (error) throw error;

      // Notify admin
      await notifyAdminNewMember(
        profile ? `${profile.first_name} ${profile.last_name}` : "User"
      );

      toast.success("Application submitted! We'll review it shortly.");
      setApplicationData({ motivation: "", commitment: "" });
    } catch (error: any) {
      toast.error(`Application failed: ${error.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20">
        <Crown className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">Please log in to access BizMart Club</p>
        <Button onClick={() => window.location.href = "/login"}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-card flex items-center px-3 py-2.5 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1.5">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm ml-2">BizMart Club</span>
      </div>

      <div className="px-4 pt-6">
        {isMember ? (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h2 className="text-xl font-bold mb-4">Welcome to BizMart Club!</h2>
            <p className="text-sm text-muted-foreground">
              Enjoy exclusive benefits, early access to sales, and special rewards.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">Your Benefits</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>🛍️ Early access to flash sales</li>
                    <li>🎁 Exclusive discounts and promotions</li>
                    <li>💰 Earn 2x BCoins on all purchases</li>
                    <li>🚚 Free delivery on orders over ₱500</li>
                    <li>📞 Priority customer support</li>
                  </ul>
                </div>
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <Button                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Home
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-4 border border-border">
            <h2 className="text-xl font-bold mb-4">Join BizMart Club</h2>
            <p className="text-sm text-muted-foreground">
              Become a member to unlock exclusive benefits and rewards.
            </p>
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 border border-border">
                <h3 className="text-lg font-bold mb-3">Application</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us why you want to join BizMart Club and how you plan to contribute.
                </p>
                <div className="space-y-4">
                  <Label htmlFor="motivation" className="text-xs font-bold">Motivation</Label>
                  <Input
                    id="motivation"
                    type="textarea"
                    value={applicationData.motivation}
                    onChange={(e) => setApplicationData({ ...applicationData, motivation: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                <div className="space-y-4">
                  <Label htmlFor="commitment" className="text-xs font-bold">Commitment</Label>
                  <Input
                    id="commitment"
                    type="textarea"
                    value={applicationData.commitment}
                    onChange={(e) => setApplicationData({ ...applicationData, commitment: e.target.value })}
                    required
                    rows={4}
                  />
                </div>
                <Button                  onClick={handleApply}
                  disabled={isApplying}
                  className="w-full"
                >
                  {isApplying ? "Submitting..." : "Apply Now"}
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}