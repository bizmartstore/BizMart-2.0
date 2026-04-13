# Hottest Sale Products Implementation

## Overview

This implementation creates a system where the hottest sale products refresh every 2 hours, displaying 4 new discounted products with prices starting from ₱50.00 and above.

## System Architecture

### 1. Database Layer

#### Tables Created:
- **`hottest_sale_products`** - Tracks which products are currently in the hottest sale rotation
  - `id`: UUID primary key
  - `product_id`: TEXT referencing products(id) - products with price >= ₱50.00
  - `created_at`: Timestamp of when the product was added
  - `updated_at`: Timestamp of last update

#### Database Functions:
- **`refresh_hottest_sale_products()`** - SQL function that:
  - Deletes all existing hottest sale products
  - Selects 4 new discounted products (price >= ₱50.00) with highest discount percentages
  - Inserts them into the hottest_sale_products table
  - Orders by discount percentage (descending), then by price (descending), then randomly

#### Row Level Security (RLS):
- All policies are set to authenticated users only
- SELECT: All authenticated users can view
- INSERT/UPDATE/DELETE: All authenticated users can perform

### 2. Edge Function Layer

#### Function: `refresh-hottest-sale`
- **Location**: `supabase/functions/refresh-hottest-sale/index.ts`
- **Purpose**: Calls the database function to refresh hottest sale products
- **Authentication**: Requires Supabase JWT token
- **CORS**: Properly configured for web access
- **Logging**: Standardized logging format

#### Features:
- Manual testing capability via POST request
- Authentication verification
- Error handling and logging
- Rate limiting awareness

### 3. Frontend Layer

#### Component: `HottestSaleSection`
- **Location**: `src/components/HottestSaleSection.tsx`
- **Purpose**: Displays the hottest sale products with auto-scrolling animation
- **Features**:
  - Fetches products from `hottest_sale_products` table via Supabase
  - Auto-scrolling animation (slow speed like BizMart Features)
  - Discount badges (big and red)
  - Price comparisons (original vs discounted)
  - Hover and tap animations
  - Real-time updates every 30 seconds
  - Loading skeletons
  - Empty state handling

#### Hook: `useHottestSaleProducts`
- **Location**: `src/hooks/useProducts.ts`
- **Purpose**: Custom hook to fetch hottest sale products
- **Features**:
  - React Query integration
  - Automatic refetching
  - Error handling
  - Type safety

### 4. Scheduling Layer

#### Cron Job Setup:
- **Schedule**: Every 2 hours (0 */2 * * *)
- **Function URL**: `https://yzlqjyurbcxzqlsypkjh.supabase.co/functions/v1/refresh-hottest-sale`
- **Authentication**: Supabase service role key in Authorization header
- **Configuration**: Defined in `supabase/config.toml`

## Data Flow

```
Cron Job (Every 2 hours)
    ↓
Edge Function (refresh-hottest-sale)
    ↓
Database Function (refresh_hottest_sale_products)
    ↓
  Deletes existing hottest sale products
  ↓
  Selects 4 new discounted products (price >= ₱50.00)
  ↓
  Orders by discount percentage (highest first)
  ↓
  Inserts into hottest_sale_products table
    ↓
Frontend Component (HottestSaleSection)
    ↓
  Fetches products via Supabase
  ↓
  Displays with auto-scrolling animation
  ↓
  User sees updated hottest sale products
```

## Selection Criteria

Products are selected based on:

1. **Price Filter**: `price >= 50.00`
2. **Discount Filter**: Must have an active discount (`sale_price < price`)
3. **Sorting**:
   - Primary: Discount percentage (highest first)
   - Secondary: Original price (highest first)
   - Tertiary: Random (for variety)
4. **Quantity**: Exactly 4 products selected

## Discount Calculation

```typescript
const basePrice = product.original_price ? Number(product.original_price) : Number(product.price);
const salePrice = product.sale_price ? Number(product.sale_price) : basePrice;
const discountPercent = Math.round(((basePrice - salePrice) / basePrice) * 100);
```

## Frontend Display

### Product Card Features:
- **Discount Badge**: Big red badge showing discount percentage
- **Price Display**: Showing discounted price with original price crossed out if different
- **Auto-scrolling**: Smooth horizontal scrolling animation
- **Hover Effects**: Scale and elevation on hover
- **Tap Effects**: Scale on tap
- **Navigation**: Click to navigate to product detail page

### Animation Details:
- **Speed**: 0.03 (smooth control, similar to BizMart Features)
- **Direction**: Leftward continuous scrolling
- **Loop**: Seamless loop without jumps
- **Pause**: Pauses on user interaction (touch/mouse)
- **Resume**: Resumes after 2 seconds of inactivity

## Security Considerations

1. **Authentication**: All edge function calls require JWT
2. **Database RLS**: All tables have proper Row Level Security
3. **Service Role Key**: Used only for cron job execution
4. **Input Validation**: Database function validates product selection
5. **Error Handling**: Comprehensive error handling at all levels

## Performance Optimization

1. **Stale Time**: 10 seconds for frontend queries
2. **Refetch Interval**: 30 seconds for frontend queries
3. **Caching**: Database results are cached appropriately
4. **Batch Operations**: Single database operation for refresh
5. **Minimal Data Transfer**: Only necessary fields are fetched

## Testing

### Manual Testing:
```bash
# Trigger the edge function manually
curl -X POST https://yzlqjyurbcxzqlsypkjh.supabase.co/functions/v1/refresh-hottest-sale \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Expected Behavior:
1. Function executes successfully
2. Database function runs without errors
3. 4 new discounted products appear in hottest_sale_products table
4. Frontend component displays updated products
5. Auto-scrolling animation works correctly

### Error Scenarios:
1. **No products with price >= ₱50.00**: Returns empty array, frontend shows nothing
2. **No products with active discounts**: Returns empty array, frontend shows nothing
3. **Database error**: Logs error, frontend shows loading state
4. **Authentication failure**: Returns 401 error

## Deployment Steps

1. **Database Setup**:
   ```sql
   -- Run the SQL to create table and function
   -- Tables and functions are already created via execute_sql tool
   ```

2. **Edge Function Setup**:
   - Function is created at `supabase/functions/refresh-hottest-sale/index.ts`
   - Config added to `supabase/config.toml`
   - README created for documentation

3. **Frontend Integration**:
   - Component updated at `src/components/HottestSaleSection.tsx`
   - Hook added to `src/hooks/useProducts.ts`
   - Component already integrated in `src/pages/Index.tsx`

4. **Cron Job Setup**:
   - Configure in Supabase Dashboard: Project Settings > Database > Cron Jobs
   - Schedule: `0 */2 * * *` (every 2 hours)
   - Function URL: `https://yzlqjyurbcxzqlsypkjh.supabase.co/functions/v1/refresh-hottest-sale`
   - Add Authorization header with service role key

## Monitoring

### Logs to Check:
1. **Edge Function Logs**: Supabase > Functions > refresh-hottest-sale > Logs
2. **Database Logs**: Supabase > Database > Logs
3. **Cron Job Logs**: Supabase > Database > Cron Jobs

### Key Log Messages:
- `[refresh-hottest-sale] Starting hottest sale refresh...`
- `[refresh-hottest-sale] Successfully refreshed hottest sale products`
- `[refresh-hottest-sale] Error refreshing hottest sale products: [error]`

## Future Enhancements

1. **Dynamic Price Threshold**: Make ₱50.00 configurable via admin settings
2. **Quantity Configuration**: Allow admin to set how many products to display
3. **Category Filtering**: Option to focus on specific categories
4. **Duration Control**: Set how long each product stays in rotation
5. **Manual Override**: Admin can manually select products for hottest sale
6. **Analytics**: Track which hottest sale products get the most views/conversions

## No Overlapping Functionality

This implementation ensures no overlapping with existing features:

1. **Flash Sale Section**: Uses `flash_sale_products` table, different data source
2. **Deals of the Day**: Uses `deals_of_the_day` table, different data source
3. **Trending Now**: Uses sales data, different algorithm
4. **Featured Products**: Uses product popularity, different criteria

All sections use separate database tables and queries, ensuring clean separation of concerns.

## Files Modified/Created

### Created:
- `supabase/functions/refresh-hottest-sale/index.ts`
- `supabase/functions/refresh-hottest-sale/README.md`
- `supabase/functions/_shared/scheduler.ts`
- `HOTTEST_SALE_IMPLEMENTATION.md` (this file)

### Modified:
- `src/components/HottestSaleSection.tsx` - Updated to fetch from hottest_sale_products
- `src/hooks/useProducts.ts` - Added useHottestSaleProducts hook
- `supabase/config.toml` - Added function configuration

### Database Changes (via execute_sql):
- Created `hottest_sale_products` table
- Created `refresh_hottest_sale_products()` function
- Created RLS policies

## Verification

To verify the implementation is working:

1. Check that the edge function deploys successfully
2. Set up the cron job in Supabase Dashboard
3. Wait for the cron job to execute (or trigger manually)
4. Check the hottest_sale_products table has 4 products
5. Verify the frontend displays the products correctly
6. Check logs for any errors

## Support

For issues or questions:
- Check edge function logs first
- Verify database function works independently
- Ensure cron job is properly configured
- Check that products meet the selection criteria (price >= ₱50.00, active discount)
