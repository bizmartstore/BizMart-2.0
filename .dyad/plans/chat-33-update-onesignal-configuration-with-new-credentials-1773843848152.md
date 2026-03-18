---
title: "Update OneSignal Configuration with New Credentials"
summary: "Update OneSignal app ID and API key in codebase to fix push notification issues"
chatId: "33"
createdAt: "2026-03-18T14:24:08.151Z"
updatedAt: "2026-03-18T14:24:08.151Z"
---

## Overview
Update the OneSignal configuration with new credentials to ensure push notifications work properly for both customer and admin accounts.

## UI/UX Design
- No UI changes required
- Notifications will now properly trigger for all users

## Considerations
- Ensure new credentials are correctly placed in code
- Verify service worker paths remain compatible
- Test notifications on both customer and admin accounts

## Technical Approach
1. Update OneSignal app ID in `src/components/OneSignalInit.tsx`
2. Update API key in `src/lib/notifications.ts`
3. Maintain existing service worker configuration

## Implementation Steps
1. Replace old app ID with new ID: "56883e62-5aae-4486-b9c3-84e5e1db41c9"
2. Update API key with new value: "os_v2_app_k2ed4ys2vzcinoodqts6dw2bzf6cs7rdezju7teyujmbmcgxhevmwurvi6yek5s35vzst2jyjm4vnttrk5d3nfz5zlrdu5qfxsvgeui"
3. Keep existing service worker paths unchanged

## Code Changes
- Update `src/components/OneSignalInit.tsx` with new app ID
- Update `src/lib/notifications.ts` with new API key

## Testing Strategy
- Test push notifications for order status updates
- Verify notifications appear on both customer and admin devices
- Check OneSignal dashboard for successful deliveries