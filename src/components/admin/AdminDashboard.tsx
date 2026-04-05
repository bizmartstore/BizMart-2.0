import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminCategoryManager from "./AdminCategoryManager";

{/* Existing tabs */}
<Tabs defaultValue="products">
  <TabsList className="w-full grid grid-cols-3 mb-4">
    <TabsTrigger value="products" className="gap-1"><Package className="h-3 w-3" /> Products</TabsTrigger>
    <TabsTrigger value="settings" className="gap-1"><Store className="h-3 w-3" /> Store</TabsTrigger>
    <TabsTrigger value="orders" className="gap-1"><TrendingUp className="h-3 w-3" /> Orders</TabsTrigger>
    {/* NEW CATEGORY TAB */}
    <TabsTrigger value="categories" className="gap-1"><Package className="h-3 w-3" /> Categories</TabsTrigger>
  </TabsList>

  <TabsContent value="products"><SellerProductsTab user={user} /></TabsContent>
  <TabsContent value="settings"><StoreSettingsTab user={user} /></TabsContent>
  <TabsContent value="orders"><SellerOrdersTab user={user} /></TabsContent>

  {/* NEW CONTENT FOR CATEGORIES TAB */}
  <TabsContent value="categories"><AdminCategoryManager /></TabsContent>
</Tabs>