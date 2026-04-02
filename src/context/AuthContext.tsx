import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// --- Cart Context ---
export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

// --- Auth Context ---
export const AuthContext = createContext<{
  user: any | null;
  profile: any | null;
  loading: boolean;
}>({
  user: null,
  profile: null,
  loading: true,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: currentUser } = supabase.auth.getUser();
    setUser(currentUser);

    const { data: profileData, error: profError } = supabase
      .from("profiles")
      .select("*")
      .eq("user_id", currentUser?.id)
      .single();

    if (!profError && profileData) {
      setProfile(profileData);
    } else {
      // 2. If profile is missing, create it
      if (!profileData && !profError) {
        console.log("[AuthContext] Profile missing, creating...");
        const { data: newProf, error: insertError } = supabase
          .from("profiles")
          .insert({
            user_id: currentUser?.id!,
            email: currentUser?.email!,
            first_name: metadata?.first_name || "",
            last_name: metadata?.last_name || "",
            school: metadata?.school || "",
            section: metadata?.section || "",
            grade_level: metadata?.grade_level || "",
            bcoins: 0,
          })
          .select()
          .single();

        if (!insertError) setProfile(newProf);
        else console.warn("[AuthContext] Profile creation failed:", insertError.message);
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        // Refresh profile on any auth change
        const { data: profileData, error: profError } = supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session?.user?.id)
          .single();

        if (!profError && profileData) {
          setProfile(profileData);
        } else {
          if (!profileData && !profError) {
            console.log("[AuthContext] Profile missing, creating...");
            const { data: newProf, error: insertError } = supabase
              .from("profiles")
              .insert({
                user_id: session?.user?.id!,
                email: session?.user?.email!,
                first_name: metadata?.first_name || "",
                last_name: session?.user?.last_name || "",
                school: metadata?.school || "",
                section: metadata?.section || "",
                grade_level: metadata?.grade_level || "",
                bcoins: 0,
              })
              .select()
              .single();

            if (!insertError) setProfile(newProf);
            else console.warn("[AuthContext] Profile creation failed:", insertError.message);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Dummy metadata object – replace with real values or remove if not used
  const metadata: any = {};

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;