# Scheduled Flash Sale Rotation

This edge function is triggered automatically every 2 hours by Supabase Cron to rotate flash sale products.

## How It Works

1. **Triggers the `rotate-flash-sale` edge function** to select 4 random products priced at or above ₱50.00
2. **Applies 5%-10% discount** to the selected products
3. **Updates the `app_settings` table** with the new flash sale end time
4. **Refreshes the hottest sale products** by calling the `refresh_hottest_sale_products` database function

## Configuration

The scheduled job is configured in `supabase/migrations/20260412000002_add_flash_sale_scheduled_job.sql`

## Manual Testing

To manually trigger the rotation:

```bash
curl -X POST https://zvtwkhlmexvkefgwvfdp.supabase.co/functions/v1/scheduled-flash-sale-rotation \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## Response Format

```json
{
  "success": true,
  "rotated": true,
  "ends_at": "2026-04-12T12:00:00.000Z",
  "count": 4
}
```

## Edge Cases Handled

- If fewer than 4 eligible products exist, returns all available products
- If no eligible products exist, returns an empty array
- Automatically resets previous flash sale products to their original prices
- Handles force rotation via the `x-force-rotate` header

## Database Dependencies

- `products` table - Contains all product data
- `app_settings` table - Stores flash sale state (ends_at, product_ids)
- `hottest_sale_products` table - Stores the current hottest sale products
- `refresh_hottest_sale_products()` function - Refreshes the hottest sale products

## Real-time Updates

The frontend automatically listens for changes to the `products` table and updates the UI in real-time.
