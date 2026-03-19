import { ShoppingCart } from "lucide-react";
import { Printer } from "lucide-react";
import { Tag } from "lucide-react";
// Use them correctly:
<TabsTrigger value="orders" className="text-xs gap-1"><ShoppingCart className="h-3 w-3" />Orders</TabsTrigger>
<TabsTrigger value="posts" className="text-xs gap-1"><MessageSquare className="h-3 w-3" />Posts</TabsTrigger>
<TabsTrigger value="codes" className="text-xs gap-1"><Tag className="h-3 w-3" />Codes</TabsTrigger>
<TabsTrigger value="pos" className="text-xs gap-1"><Receipt className="h-3 w-3" />POS</TabsTrigger>