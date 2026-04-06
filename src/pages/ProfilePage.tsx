import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Crown, Store, MessageCircle, User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, GraduationCap, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart } from "@/context/CartContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  school: z.string().optional(),
  grade_level: z.string().optional(),
  section: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { storeOpen } = useAppSettings();
  const { toast: showToast } = useToast();
  const [orderCount, setOrderCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      school: profile?.school || "",
      grade_level: profile?.grade_level || "",
      section: profile?.section || "",
      bio: profile?.bio || "",
    },
  });

  useEffect(() => {
    if (!user) return;
    (supabase as any).from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }: any) => setOrderCount(count || 0));
  }, [user]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update(data)
        .eq("user_id", user.id);

      if (error) throw error;
      showToast({ title: "Profile updated!" });
      setIsEditing(false);
    } catch (error: any) {
      showToast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-extrabold text-lg mb-2">My Profile</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to view your profile.</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-3 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-extrabold text-lg">My Profile</h1>
          {!isEditing ? (
            <Button size="sm" onClick={() => setIsEditing(true)} variant="outline" className="gap-1">
              <Edit2 className="h-3 w-3" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setIsEditing(false); reset(); }} variant="outline" className="gap-1">
                <X className="h-3 w-3" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={saving} className="gap-1">
                <Save className="h-3 w-3" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">First Name</Label>
                      <Input {...register("first_name")} className="text-sm" />
                      {errors.first_name && <p className="text-[10px] text-destructive">{errors.first_name.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs">Last Name</Label>
                      <Input {...register("last_name")} className="text-sm" />
                      {errors.last_name && <p className="text-[10px] text-destructive">{errors.last_name.message}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-extrabold">{profile?.first_name} {profile?.last_name}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">School</Label>
                  <Input {...register("school")} className="text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Grade Level</Label>
                  <Input {...register("grade_level")} className="text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Section</Label>
                <Input {...register("section")} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs">Bio</Label>
                <Textarea {...register("bio")} className="text-sm" rows={3} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {profile?.school && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.school}</span>
                </div>
              )}
              {profile?.grade_level && profile?.section && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.grade_level} - {profile.section}</span>
                </div>
              )}
              {profile?.bio && (
                <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-extrabold text-primary">{orderCount}</p>
            <p className="text-[10px] text-muted-foreground">Orders</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-extrabold text-warning">{profile?.bcoins || 0}</p>
            <p className="text-[10px] text-muted-foreground">BCoins</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={() => navigate("/club")} variant="outline" className="w-full justify-start gap-2">
            <Crown className="h-4 w-4" /> BizMart Club
          </Button>
          <Button onClick={() => navigate("/messages")} variant="outline" className="w-full justify-start gap-2">
            <MessageCircle className="h-4 w-4" /> Messages
          </Button>
          {profile?.role === 'main_admin' || profile?.role === 'member_admin' ? (
            <Button onClick={() => navigate("/admin")} variant="outline" className="w-full justify-start gap-2">
              <Shield className="h-4 w-4" /> Admin Dashboard
            </Button>
          ) : null}
        </div>

        <div className="mt-6">
          <Button onClick={signOut} variant="destructive" className="w-full gap-2">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}