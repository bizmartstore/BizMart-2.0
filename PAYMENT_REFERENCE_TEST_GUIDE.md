# Payment Reference Validation - Test Guide

## Overview
This guide provides step-by-step instructions to test the payment reference validation fix for organization join requests.

## Prerequisites
1. Admin access to the RegistrationCodesTab
2. At least one approved organization in the system
3. User account to test join requests

## Test Steps

### Step 1: Generate Payment Reference (Admin)
1. Navigate to the Admin Dashboard
2. Go to the "Registration Codes" tab
3. Click "Generate Sample Reference" button
4. Note the generated 6-digit payment reference number (e.g., "123456")
5. Verify the reference appears in the payment references list with status "Available"

### Step 2: Verify Payment Reference in Organizations Page (User)
1. Navigate to the Organizations page
2. Find an approved organization that you're not a member of
3. Look for the payment reference display section
4. Verify the payment reference number matches the one generated in Step 1
5. Verify the amount is displayed correctly (e.g., "₱50.00")

### Step 3: Submit Join Request with Payment Reference (User)
1. Click the "Join Organization" button on the organization card
2. In the join dialog, check the "I have paid the organization fee" checkbox
3. Enter the payment reference number from Step 1
4. Click "Submit Join Request"

### Expected Results

#### Success Scenario:
✅ The join request is submitted successfully
✅ Toast message: "Your request to join has been submitted! Please wait for admin approval."
✅ The dialog closes automatically
✅ The payment reference is marked as "Used" in the payment_references table
✅ The reference_code field in the organization_members table is populated with the reference number

#### Failure Scenarios to Test:

**Test 1: Invalid Payment Reference**
1. Enter a random 6-digit number that doesn't exist
2. Expected: Error message "Invalid or already used payment reference number. Please check and try again."

**Test 2: Already Used Payment Reference**
1. Use a payment reference that was already used in a previous test
2. Expected: Error message "Invalid or already used payment reference number. Please check and try again."

**Test 3: Empty Payment Reference**
1. Leave the payment reference field empty
2. Expected: Error message "Please enter your payment reference number"

**Test 4: Unpaid Checkbox Not Checked**
1. Enter a valid payment reference
2. Don't check the "I have paid" checkbox
3. Expected: Error message "Please confirm that you have paid the organization fee"

## Database Verification

To verify the fix at the database level:

### Check Payment Reference Status
```sql
SELECT * FROM payment_references WHERE reference_code = '123456';
```
Expected result:
- `used` should be `true`
- `used_by` should contain the user's ID
- `used_at` should have a timestamp

### Check Organization Member Record
```sql
SELECT * FROM organization_members WHERE user_id = 'USER_ID' AND organization_id = 'ORG_ID';
```
Expected result:
- `status` should be `pending`
- `reference_code` should contain the payment reference number

## Troubleshooting

If the test fails:

1. **Check the console logs** for any error messages
2. **Verify the payment reference exists** in the payment_references table
3. **Check if the reference is marked as used**
4. **Ensure the organization is approved** and not archived
5. **Verify the user is not already a member** of the organization

## Files Modified

1. **src/components/JoinOrganizationInstructionDialog.tsx**
   - Fixed payment reference validation query
   - Fixed payment reference marking logic

2. **src/pages/OrganizationsPage.tsx**
   - Added payment reference fetching for each organization
   - Updated organization data structure to include reference_code and amount

## Technical Details

### Payment Reference Flow

1. **Generation** (RegistrationCodesTab):
   - Admin generates a 6-digit reference code
   - Code is stored in `payment_references` table with:
     - `organization_id`: The organization the payment is for
     - `reference_code`: The 6-digit number
     - `amount`: The fee amount
     - `used`: false (initially)

2. **Display** (OrganizationsPage):
   - For each approved organization, fetch the available payment reference
   - Display the reference code and amount to users

3. **Validation** (JoinOrganizationInstructionDialog):
   - User enters the payment reference
   - System validates:
     - Reference exists in payment_references table
     - Reference is not used (used = false)
     - Reference belongs to the correct organization
   - If valid, create organization_members record
   - Mark payment reference as used

### Database Schema

```sql
-- payment_references table
CREATE TABLE payment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reference_code TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- organization_members table (relevant fields)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  reference_code TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Success Criteria

✅ Payment references generated in RegistrationCodesTab can be used in OrganizationsPage
✅ Users can successfully submit join requests with valid payment references
✅ Invalid or used payment references are properly rejected
✅ Payment references are marked as used after successful submission
✅ Organization admins can track which users have paid
