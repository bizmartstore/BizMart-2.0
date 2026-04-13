# Flash Sale Auto-Rotation Implementation

## Overview

This implementation enables automatic flash sale product rotation every 2 hours, ensuring fresh discounts are always displayed to users.

## Changes Made

### 1. Database Schema Updates

#### Created `hottest_sale_products` Table
- **Purpose**: Stores the current hottest sale products
- **Structure**:
  - `id`: UUID (primary key)
  - `product_id`: TEXT (references products.id)
  - `is_active`: BOOLEAN (default: true)
  - `ends_at`: TIMESTAMP WITH TIME ZONE
  - `created_at`: TIMESTAMP WITH TIME ZONE (default: NOW())
  - `updated_at`: TIMESTAMP WITH TIME ZONE (default: NOW())

#### Created `refresh_hottest_sale_products()` Function
- **Purpose**: Refreshes the hottest sale products table
- **Logic**:
  - Deletes all existing hottest sale products
  - Selects 4 products priced at or above ₱50.00 with active discounts
  - Prioritizes products with higher discount percentages
  - Orders by discount percentage (descending), price (descending), then random

#### Created `update_hottest_sale_updated_at()` Function
- **Purpose**: Updates the `updated_at` timestamp automatically

#### Created Trigger for `hottest_sale_products`
- **Trigger**: `update_hottest_sale_timestamp`
- **Event**: BEFORE UPDATE
- **Function**: `update_hottest_sale_updated_at()`

### 2. Edge Functions

#### Created `scheduled-flash-sale-rotation` Edge Function
- **Location**: `supabase/functions/scheduled-flash-sale-rotation/index.ts`
- **Purpose**: Automatically triggers flash sale rotation every 2 hours
- **Logic**:
  1. Calls the existing `rotate-flash-sale` edge function
  2. Refreshes hottest sale products via database function
  3. Returns success/failure status

#### Existing `rotate-flash-sale` Edge Function (Updated)
- **Purpose**: Handles the core flash sale rotation logic
- **Logic**:
  1. Resets all previous flash sale products to original prices
  2. Selects 4 random products priced at or above ₱50.00
  3. Applies 5%-10% discount to each product
  4. Updates `app_settings` with new flash sale end time (2 hours from now)
  5. Returns the rotation result

### 3. Scheduled Job

#### Created Scheduled Job
- **Name**: `flash_sale_rotation`
- **Schedule**: Every 2 hours (02:00, 04:00, 06:00, etc.)
- **Job Type**: Edge Function
- **Payload**: Calls `scheduled-flash-sale-rotation` edge function
- **Status**: Active

### 4. Hooks Updates

#### Updated `useFlashSaleProducts()` Hook
- **Location**: `src/hooks/useProducts.ts`
- **Changes**:
  - Now fetches from the `products` table where `is_flash_sale = true`
  - Filters for products with actual discounts (sale_price < original_price)
  - Increased refetch frequency (15 seconds) for real-time updates
  - Added proper error handling and fallback

### 5. Component Updates

#### Updated `HottestSaleSection` Component
- **Location**: `src/components/HottestSaleSection.tsx`
- **Changes**:
  - Now uses `useFlashSaleProducts()` instead of `useProducts()`
  - Displays the same products as the FlashSaleSection
  - Shows "Hottest Flash Sale!" title
  - Calculates and displays max discount percentage
  - Uses the same discount badge styling as FlashSaleSection
  - Maintains auto-scrolling animation

### 6. Real-time Updates

#### Index Page Real-time Listeners
- **Location**: `src/pages/Index.tsx`
- **Changes**:
  - Listens for changes to the `products` table
  - Only refreshes when flash sale status changes (`is_flash_sale`)
  - Also listens for `app_settings` updates (flash_sale_state changes)

### 7. RLS Policies

#### Added RLS Policies
- **Products Table**:
  - `Users can view flash sale products` - Allows viewing products where `is_flash_sale = true`
  - `Authenticated users can insert flash sale products` - Allows inserting flash sale products
  - `Authenticated users can update flash sale products` - Allows updating flash sale products
  - `Users can view products` - General policy for all users

- **Hottest Sale Products Table**:
  - `Users can view hottest sale products` - Allows viewing active hottest sale products

### 8. Configuration Updates

#### Updated `supabase/config.toml`
- Added `[functions.scheduled-flash-sale-rotation]` section
- Set `verify_jwt = false` for the new edge function

#### Created SQL Migration
- **File**: `supabase/migrations/20260412000002_add_flash_sale_scheduled_job.sql`
- **Purpose**: Adds the scheduled job to the database

## How It Works

### The Complete Flow:

1. **Every 2 Hours**:
   - Supabase Cron triggers the `flash_sale_rotation` scheduled job
   - Job calls the `scheduled-flash-sale-rotation` edge function
   
2. **Edge Function Execution**:
   - Calls the `rotate-flash-sale` edge function
   - Resets previous flash sale products to original prices
   - Selects 4 new random products priced ≥ ₱50.00
   - Applies 5%-10% discount to each product
   - Updates `app_settings` with new end time
   
3. **Database Updates**:
   - Products table updated with new `is_flash_sale`, `sale_price`, `discount_percent`, `original_price`
   - `hottest_sale_products` table refreshed via `refresh_hottest_sale_products()` function
   
4. **Real-time Updates**:
   - Supabase real-time channel broadcasts the changes
   - Frontend components listening to `products` table receive updates
   - UI automatically refreshes to show new flash sale products

5. **User Experience**:
   - Users see the new flash sale products immediately
   - Countdown timer shows 2 hours remaining
   - HottestSaleSection displays the same products
   - Smooth transitions between product changes

## Edge Cases Handled

1. **Fewer than 4 Eligible Products**:
   - Returns all available eligible products
   - If only 1 product is eligible, displays only that product

2. **No Eligible Products**:
   - Returns empty array
   - Flash sale sections are hidden

3. **Network Issues**:
   - Hooks have proper error handling
   - Fallback to cached data if available
   - Refetch attempts on window focus/reconnect

4. **Concurrent Updates**:
   - Real-time channel ensures all clients stay in sync
   - Database triggers maintain data consistency

## Testing Strategy

### Manual Testing:
1. **Trigger Edge Function Manually**:
   ```bash
   curl -X POST https://zvtwkhlmexvkefgwvfdp.supabase.co/functions/v1/scheduled-flash-sale-rotation \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
   ```

2. **Verify Database Changes**:
   - Check `products` table for updated `is_flash_sale`, `sale_price`, `discount_percent`
   - Check `app_settings` for new `flash_sale_state` with updated `ends_at`
   - Check `hottest_sale_products` table for new entries

3. **Verify UI Updates**:
   - Refresh the homepage
   - Verify FlashSaleSection shows new products
   - Verify HottestSaleSection shows the same products
   - Verify countdown timer shows 2 hours

### Automated Testing:
- Real-time updates propagate correctly
- Products change every 2 hours automatically
- HottestSaleSection stays in sync with FlashSaleSection
- Discounts are applied correctly (5%-10%)
- Original prices are restored after flash sale ends

## Performance Considerations

1. **Refetch Interval**: 15 seconds for flash sale products
2. **Stale Time**: 10 seconds for flash sale products
3. **Real-time Updates**: Supabase channels provide instant updates
4. **Database Indexes**: Ensure proper indexes on `products.price`, `products.is_flash_sale`

## Security Considerations

1. **RLS Policies**: All tables have proper Row Level Security
2. **Edge Function Authentication**: Uses service role key for internal calls
3. **Data Validation**: Edge functions validate product eligibility
4. **Rate Limiting**: Supabase handles edge function rate limits

## Monitoring

1. **Edge Function Logs**: Available in Supabase dashboard
2. **Database Logs**: Check for errors in scheduled job execution
3. **Real-time Channel**: Monitor for connection issues
4. **UI Console Logs**: Check for frontend errors

## Future Enhancements

1. **Weighted Product Selection**: Prioritize products with higher sales velocity
2. **Category-Based Rotation**: Allow rotation within specific categories
3. **User-Specific Flash Sales**: Personalize flash sales based on user preferences
4. **Analytics Tracking**: Track flash sale performance and conversions
5. **Custom Discount Ranges**: Allow admin-defined discount ranges

## Files Modified/Created

### New Files:
- `supabase/functions/scheduled-flash-sale-rotation/index.ts`
- `supabase/functions/scheduled-flash-sale-rotation/README.md`
- `supabase/migrations/20260412000002_add_flash_sale_scheduled_job.sql`
- `FLASH_SALE_AUTO_ROTATION_IMPLEMENTATION.md`

### Modified Files:
- `src/hooks/useProducts.ts` - Updated `useFlashSaleProducts()` hook
- `src/components/HottestSaleSection.tsx` - Updated to use flash sale products
- `src/pages/Index.tsx` - Added real-time listeners for flash sale changes
- `supabase/config.toml` - Added edge function configuration

### Database Changes:
- Created `hottest_sale_products` table
- Created `refresh_hottest_sale_products()` function
- Created `update_hottest_sale_updated_at()` function
- Created trigger `update_hottest_sale_timestamp`
- Added RLS policies for new tables
- Added scheduled job `flash_sale_rotation`

## Verification Checklist

- [x] Database tables created with proper structure
- [x] Edge functions created and configured
- [x] Scheduled job configured to run every 2 hours
- [x] RLS policies added for security
- [x] Hooks updated to fetch flash sale products
- [x] Components updated to display flash sale products
- [x] Real-time updates configured
- [x] Documentation created
- [ ] Manual testing completed
- [ ] Edge cases tested

## Deployment Notes

1. The scheduled job will automatically start running after the migration is applied
2. No manual intervention required for the 2-hour rotation
3. Monitor the first rotation to ensure it works correctly
4. Adjust discount ranges or product eligibility as needed

## Support

For issues or questions, refer to:
- Supabase Dashboard: Project logs and monitoring
- Edge Function Logs: Real-time execution logs
- Database Logs: SQL query execution and errors
- Frontend Console: Browser console for UI issues
