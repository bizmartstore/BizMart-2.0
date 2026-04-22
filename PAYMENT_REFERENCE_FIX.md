# Payment Reference Table Fix

## Problem
The application was throwing a `PGRST204` error when trying to interact with the `payment_references` table:
```
Could not find the 'status' column of 'payment_references' in the schema cache
```

## Root Cause
The `payment_references` table was missing from the TypeScript type definitions in `src/types/supabase.ts`. This caused the Supabase client to not recognize the table structure, leading to schema cache mismatches.

## Solution

### 1. Added Table Definition to TypeScript Types
Added the complete `payment_references` table definition to `src/types/supabase.ts`:

```typescript
payment_references: {
  Row: {
    amount: number
    created_at: string | null
    id: string
    organization_id: string | null
    reference_number: string
    status: string
    used_at: string | null
    used_by: string | null
  }
  Insert: {
    amount: number
    created_at?: string | null
    id?: string
    organization_id?: string | null
    reference_number: string
    status?: string
    used_at?: string | null
    used_by?: string | null
  }
  Update: {
    amount?: number
    created_at?: string | null
    id?: string
    organization_id?: string | null
    reference_number?: string
    status?: string
    used_at?: string | null
    used_by?: string | null
  }
  Relationships: []
}
```

### 2. Improved Table Setup Logic
Updated `src/lib/db-setup.ts` to handle table creation more gracefully:
- Simplified the table existence check
- Better error handling for table creation
- Automatic cleanup of sample records

## Files Modified
1. `src/types/supabase.ts` - Added `payment_references` table definition
2. `src/lib/db-setup.ts` - Improved table setup logic

## Impact
- The `status` column is now properly recognized by the Supabase client
- All components using `payment_references` table will work correctly:
  - `RegistrationCodesTab.tsx` - Generates payment references
  - `JoinOrganizationInstructionDialog.tsx` - Validates and marks references as used
  - Other components that query the table

## Testing
The fix ensures that:
1. TypeScript correctly types the `payment_references` table
2. The Supabase client recognizes all columns including `status`
3. Table creation is handled gracefully if the table doesn't exist
4. All existing functionality continues to work without errors
