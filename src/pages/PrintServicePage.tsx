import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintServicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopBar />
        <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
          <Printer className="h-16 w-16 text-primary mb-4" />
          <h2 className="font-extrabold text-lg mb-2">Print Service</h2>
          <p className="text-sm text-muted-foreground mb-6">Please login to upload and print your documents.</p>
          <Button onClick={() => navigate("/login")}>Login to Continue</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar />
      <div className="px-4 mt-6 text-center">
        <Printer className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="font-extrabold text-xl mb-2">Print Service</h1>
        <p className="text-sm text-muted-foreground mb-6">Upload your files and select print options.</p>
        <div className="bg-card rounded-2xl p-6 border border-border">
          <p className="text-sm text-muted-foreground">Print service interface coming soon!</p>
          <Button onClick={() => navigate("/")} className="mt-4">Back to Home</Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}