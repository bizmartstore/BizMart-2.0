import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { NavLink } from "@/components/NavLink";
import { Home, Search, ShoppingCart, User, FileText } from "lucide-react";

export default function BottomNav() {
  const { totalItems } = useCart();
  const { user } = useAuth();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-2 py-1 flex justify-around items-center">
      <NavLink to="/" className="flex flex-col items-center p-2 text-muted-foreground" activeClassName="text-primary">
        <Home className="h-5 w-5" />
        <span className="text-[10px]">Home</span>
      </NavLink>
      <NavLink to="/search" className="flex flex-col items-center p-2 text-muted-foreground" activeClassName="text-primary">
        <Search className="h-5 w-5" />
        <span className="text-[10px]">Search</span>
      </NavLink>
      <NavLink to="/cart" className="flex flex-col items-center p-2 text-muted-foreground relative" activeClassName="text-primary">
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 right-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-full h-3.5 min-w-3.5 flex items-center justify-center px-0.5">
            {totalItems}
          </span>
        )}
        <span className="text-[10px]">Cart</span>
      </NavLink>
      <NavLink to="/orders" className="flex flex-col items-center p-2 text-muted-foreground" activeClassName="text-primary">
        <FileText className="h-5 w-5" />
        <span className="text-[10px]">Orders</span>
      </NavLink>
      <NavLink to="/profile" className="flex flex-col items-center p-2 text-muted-foreground" activeClassName="text-primary">
        <User className="h-5 w-5" />
        <span className="text-[10px]">Profile</span>
      </NavLink>
    </div>
  );
}