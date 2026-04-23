# Payment References Fix Summary

## Problem Analysis

The issue was that payment references were not showing under the correct organization despite being generated in the admin dashboard. The root causes were:

1. **Missing Row Level Security (RLS) Policies**: The `payment_references` table had no RLS policies, causing permission issues when fetching data.

2. **Inefficient Realtime Updates**: The realtime subscription in OrganizationsPage.tsx was refreshing ALL organizations instead of just the specific one that received a new payment reference.

3. **Missing Type Definitions**: The `payment_references` table was not defined in the Supabase Database types.

4. **Callback Logic Issue**: The realtime subscription callback wasn't properly filtering by organization_id.

## Changes Made

### 1. Added RLS Policies (`supabase/sql/create_rls_policies.sql`)

Created comprehensive RLS policies for the `payment_references` table:

- **View Policy**: Allows organization members to view payment references for their organization
- **Insert Policy**: Allows organization creators to insert payment references
- **Update Policy**: Allows organization creators to update payment references
- **Used Policy**: Allows users to mark payment references as used
- **Public View Policy**: Allows anyone to view available (unused) payment references

### 2. Fixed Realtime Subscription in OrganizationsPage.tsx

**Before**: The callback was calling `fetchOrganizations()` which refreshed ALL organizations.

**After**: The callback now updates only the specific organization's payment references in state:
```typescript
setupPaymentReferencesRealtime(org.id, (newRef) => {
  setOrganizations(prevOrgs => 
    prevOrgs.map(o => 
      o.id === org.id 
        ? { ...o, payment_references: [newRef, ...(o.payment_references || [])] }
        : o
    )
  );
})
```

Also updated the useEffect dependency from `[user, organizations]` to `[user]` to prevent unnecessary re-subscriptions.

### 3. Enhanced Realtime Subscription in paymentReferences.ts

Added validation to ensure the new reference has the correct organization_id:
```typescript
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'payment_references',
    filter: `organization_id=eq.${organizationId}`
  },
  (payload) => {
    const newRef = payload.new as PaymentReference;
    if (newRef.organization_id === organizationId) {
      callback(newRef);
    }
  }
)
```

### 4. Added Type Definitions (`src/integrations/supabase/types.ts`)

Added the `payment_references` table to the Database type definitions:
```typescript
payment_references: {
  Row: {
    id: string;
    organization_id: string;
    reference_code: string;
    amount: number;
    used: boolean;
    used_by: string | null;
    used_at: string | null;
    created_at: string;
  };
  Insert: {...};
  Update: {...};
};
```

### 5. Added Realtime Subscription to RegistrationCodesTab.tsx

Added a useEffect hook to set up realtime subscription when an organization is selected:
```typescript
useEffect(() => {
  if (selectedOrgForReference) {
    const channel = setupPaymentReferencesRealtime(selectedOrgForReference.id, (newRef) => {
      setPaymentReferences(prev => [newRef, ...prev]);
    });
    paymentRefsChannels.current.push(channel);
    
    return () => {
      const index = paymentRefsChannels.current.indexOf(channel);
      if (index > -1) {
        supabase.removeChannel(channel);
        paymentRefsChannels.current.splice(index, 1);
      }
    };
  }
}, [selectedOrgForReference]);
```

### 6. Created Migration Script

Created a proper migration file: `supabase/migrations/20240101000000_add_rls_policies_for_payment_references.sql`

## Expected Behavior After Fix

1. **Payment References Show Correctly**: When a payment reference is generated for an organization in the admin dashboard, it will immediately appear in the OrganizationsPage for that specific organization.

2. **Instant UI Updates**: No page refresh is needed - the UI updates in real-time when a new payment reference is created.

3. **Proper Access Control**: Only authorized users (organization members/creators) can view and manage payment references for their organization.

4. **Consistent Data**: The organization_id is properly maintained when inserting and fetching payment references.

## Testing Steps

1. Go to Admin Dashboard > Registration Codes tab
2. Select an organization from the dropdown
3. Click "Generate Reference" to create a new payment reference
4. Go to OrganizationsPage
5. Find the organization you generated the reference for
6. The payment reference should appear immediately without refreshing the page
7. Verify the reference code, amount, and organization association are correct

## Rollback Plan

If issues arise, you can:
1. Remove the RLS policies by running SQL to drop them
2. Revert the OrganizationsPage.tsx changes to restore the old behavior
3. Remove the migration file if needed

All changes are backward compatible and won't break existing features.
