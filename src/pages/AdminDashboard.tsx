// Find the tabs array and add the job offers tab
// Add to the tabs array in AdminDashboard component:

{/* Add this tab to the tabs array */}
{isMainAdmin && (
  <TabsTrigger value="job-offers" className="text-xs gap-1">
    <Briefcase className="h-3 w-3" /> Job Offers
  </TabsTrigger>
)}

// And add the corresponding TabsContent:
{isMainAdmin && (
  <TabsContent value="job-offers">
    <AdminJobOffersTab />
  </TabsContent>
)}

// Also need to import Briefcase icon at the top:
import { Briefcase } from "lucide-react";