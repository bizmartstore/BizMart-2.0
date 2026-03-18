import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function SplashScreen({ onFinished }: { onFinished: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        navigate("/");
      } else {
        navigate("/login");
      }
      onFinished();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, navigate, onFinished]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-16 w-16">
          <img src="/bizmart-logo.png" alt="BizMart Logo" className="h-16 w-16" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">BizMart</h1>
        <p className="text-muted-foreground">Your Campus Store</p>
      </div>
    </div>
  );
}