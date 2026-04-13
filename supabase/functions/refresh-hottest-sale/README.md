# Refresh Hottest Sale Products - Edge Function

This edge function refreshes the hottest sale products every 2 hours. It selects 4 discounted products with prices starting from ₱50.00 and applies them to the `hottest_sale_products` table.

## How It Works

1. The function calls the database function `refresh_hottest_sale_products()` which:
   - Deletes all existing hottest sale products
   - Selects 4 new discounted products (price >= ₱50.00) with the highest discount percentages
   - Inserts them into the `hottest_sale_products` table

2. The frontend component `HottestSaleSection` fetches these products and displays them with auto-scrolling animation.

## Setup Cron Job

To schedule this function to run every 2 hours, you need to set up a cron job in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** > **Database** > **Cron Jobs**
3. Click **New Cron Job**
4. Configure the cron job:
   - **Name**: `refresh-hottest-sale`
   - **Schedule**: `0 */2 * * *` (every 2 hours at minute 0)
   - **Function URL**: `https://yzlqjyurbcxzqlsypkjh.supabase.co/functions/v1/refresh-hottest-sale`
   - **Secret**: Add your Supabase service role key as a header: `Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY`

## Manual Testing

You can manually trigger the function by making a POST request:

```bash
curl -X POST https://yzlqjyurbcxzqlsypkjh.supabase.co/functions/v1/refresh-hottest-sale \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Database Schema

The function uses the `hottest_sale_products` table which has the following structure:

```sql
CREATE TABLE public.hottest_sale_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Frontend Integration

The frontend component `HottestSaleSection` automatically fetches and displays the hottest sale products with:
- Auto-scrolling animation
- Discount badges
- Price comparisons
- Real-time updates

## Security

- The function requires authentication via Supabase JWT
- Uses service role key for cron job execution
- All database operations are protected by Row Level Security (RLS)

## Troubleshooting

If products aren't updating:
1. Check the cron job logs in Supabase
2. Verify the database function `refresh_hottest_sale_products()` is working
3. Ensure there are products with prices >= ₱50.00 and active discounts
4. Check the Supabase function logs for errors
