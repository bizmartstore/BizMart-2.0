# Payment References Schema Fix - Verification Guide

## Changes Made

### 1. TypeScript Types Updated (`src/types/supabase.ts`)
- Changed `reference_number` → `reference_code`
- Changed `status` → `used` (boolean)
- Removed `status` column completely from types
- Updated all Insert/Update/Row types to match actual database schema

### 2. Database Setup Updated (`src/lib/db-setup.ts`)
- Changed insert to use `reference_code` instead of `reference_number`
- Changed `status: "available"` → `used: false`

### 3. RegistrationCodesTab.tsx Updated
- Changed insert to use `reference_code` instead of `reference_number`
- Changed `status: "available"` → `used: false`

### 4. JoinOrganizationInstructionDialog.tsx Updated
- Changed query from `.eq("reference_number", referenceNumber).eq("status", "available")` 
  → `.eq("reference_code", referenceNumber).eq("used", false)`
- Changed update from `.update({ status: "used", ... })` 
  → `.update({ used: true, ... })`

## Actual Database Schema (as provided)
```
id
organization_id
used_by
reference_code
amount
created_at
used
used_at
```

## Test Cases to Verify

### Test 1: Generate Payment Reference
**Steps:**
1. Navigate to admin panel
2. Go to Registration Codes tab
3. Click "Generate Sample Reference"

**Expected Result:**
- ✅ No 400 errors
- ✅ Reference is created with correct fields:
  - `reference_code`: Generated reference number
  - `used`: false
  - `amount`: 50.00
  - `organization_id`: Sample organization ID

**Verification:**
```sql
SELECT * FROM payment_references WHERE reference_code LIKE 'ORG-SAMPLE-%';
```

### Test 2: Submit Join Request with Valid Reference
**Steps:**
1. User enters a valid payment reference number
2. User confirms payment
3. User submits join request

**Expected Result:**
- ✅ Reference is found (not used)
- ✅ Join request is created
- ✅ Reference is marked as used
- ✅ `used_by` and `used_at` are set
- ✅ No 400 errors

**Verification:**
```sql
-- Check reference is marked as used
SELECT * FROM payment_references WHERE reference_code = 'USER_INPUT_REF';

-- Check join request was created
SELECT * FROM organization_members WHERE reference_number = 'USER_INPUT_REF';
```

### Test 3: Submit Join Request with Invalid Reference
**Steps:**
1. User enters an invalid/used payment reference number
2. User tries to submit join request

**Expected Result:**
- ✅ Error message: "Invalid or already used payment reference number"
- ✅ No database changes
- ✅ No 400 errors

### Test 4: Load Payment References
**Steps:**
1. Admin views payment references list

**Expected Result:**
- ✅ All references load without errors
- ✅ Data displays correctly with organization and user info

### Test 5: Approve Join Request Flow
**Steps:**
1. Admin approves a pending join request
2. System marks payment reference as used (if not already)

**Expected Result:**
- ✅ Join request status changes to "approved"
- ✅ Payment reference remains marked as used
- ✅ No schema mismatch errors

## Database Queries for Verification

### Check Table Schema
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payment_references' 
ORDER BY column_name;
```

### Check Sample Data
```sql
SELECT id, reference_code, organization_id, amount, used, used_by, used_at, created_at 
FROM payment_references 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check for Invalid Data
```sql
-- Should return 0 rows if all fixes are correct
SELECT * FROM payment_references WHERE status IS NOT NULL;
```

## Common Issues to Watch For

❌ **400 Bad Request Errors** - Caused by sending invalid columns (like `status`)
❌ **404 Not Found Errors** - Caused by referencing non-existent columns
❌ **Type Errors** - Caused by TypeScript types not matching database schema
❌ **Data Mismatch** - Caused by using wrong column names in queries

## Rollback Plan
If issues occur:
1. Check browser console for specific error messages
2. Verify database schema matches what's in `src/types/supabase.ts`
3. Ensure all frontend code uses only existing columns
4. Check Supabase logs for detailed error information

## Success Criteria
- [ ] All TypeScript type checks pass
- [ ] Generate Payment Reference works without errors
- [ ] Join request submission works with valid references
- [ ] Join request submission fails gracefully with invalid references
- [ ] No references to `status` or `reference_number` columns remain in code
- [ ] All queries use only existing columns: `id`, `organization_id`, `used_by`, `reference_code`, `amount`, `created_at`, `used`, `used_at`
