# Monetization System Documentation

## Overview

The Suno AI Music Assistant uses a subscription-based monetization model with usage limits for song generation.

## Subscription Tiers

| Tier | Price | Generations/Month | Features |
|------|-------|-------------------|----------|
| **Free** | $0 | 5 songs | Basic song generation |
| **Pro** | $5/month | 100 songs | Full access to all features |
| **Test** | $0 | Unlimited | For testing purposes only |

## Database Schema

### `user_subscriptions`
Stores user subscription information, billing details, and Stripe integration.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- tier: 'free' | 'pro' | 'test'
- stripe_customer_id: Stripe customer ID
- stripe_subscription_id: Stripe subscription ID
- stripe_price_id: Stripe price ID
- current_period_start: Billing period start
- current_period_end: Billing period end
- cancel_at_period_end: Boolean flag
- generation_limit: Number (-1 for unlimited)
- trial_ends_at: Trial end date
- is_test_user: Boolean flag for test users
```

### `usage_logs`
Tracks all user actions for usage-based limits.

```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- action_type: 'generate' | 'regenerate_lyrics' | 'regenerate_metatags'
- song_id: UUID (references songs, nullable)
- tokens_used: Integer (for future credit system)
- model_used: String (AI model used)
- created_at: Timestamp
```

## Service Layer

### `SubscriptionService`
Located at: `lib/services/subscriptions.ts`

**Key Methods:**
- `getSubscription()`: Get current user's subscription (client-side)
- `getOrCreateSubscription()`: Get or create subscription (client-side)
- `getSubscriptionServer(userId)`: Get subscription (server-side)
- `isTestUser(userId)`: Check if user is a test user
- `isInTrial(userId)`: Check if user is in trial period
- `upgradeToPro()`: Upgrade user to Pro tier
- `downgradeToFree()`: Downgrade user to Free tier
- `setTestUser(userId, boolean)`: Set test user flag

### `UsageService`
Located at: `lib/services/usage.ts`

**Key Methods:**
- `getUsageStats()`: Get current usage stats (client-side)
- `logUsage(userId, actionType, songId)`: Log a usage event
- `getCurrentPeriodUsage(userId)`: Get usage count for current period
- `canPerformAction(userId)`: Check if user can perform action
- `getUsageStatsServer(userId)`: Get detailed usage stats

## Usage Checker Utility

Located at: `lib/utils/usage-checker.ts`

### Simple API Route Integration

```typescript
import { checkUsageLimit, logUsage, getUsageForResponse } from '@/lib/utils/usage-checker'

export async function POST(request: Request) {
  // 1. Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Check usage limit
  const usageCheck = await checkUsageLimit(user.id)
  if (!usageCheck.allowed) {
    return usageCheck.response // Returns 429 with upgrade prompt
  }

  // 3. Perform the action
  const result = await generateSong(...)

  // 4. Log the usage
  await logUsage(user.id, 'generate', result.id)

  // 5. Get updated usage stats
  const usage = await getUsageForResponse(user.id)

  // 6. Return response with usage stats
  return NextResponse.json({
    ...result,
    usage
  })
}
```

### Using `withUsageTracking` Helper

Even simpler approach:

```typescript
import { withUsageTracking } from '@/lib/utils/usage-checker'

export async function POST(request: Request) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return await withUsageTracking(
    user.id,
    'generate',
    async () => {
      const result = await generateSong(...)
      return {
        songId: result.id,
        response: result
      }
    }
  )
}
```

## Test User Setup

### Purpose
The test user (`matjosoft@gmail.com`) has unlimited access for testing the application without incurring charges or hitting limits.

### Setup Steps

1. **Create the user account:**
   - Sign up with `matjosoft@gmail.com` in the application
   - Complete the authentication flow

2. **Run the setup script:**
   ```bash
   npx tsx scripts/setup-test-user.ts
   ```

3. **Verify setup:**
   - Login as matjosoft@gmail.com
   - Check that you can generate unlimited songs
   - Verify no payment prompts appear

### Manual Setup (if script fails)

Run this SQL in Supabase:

```sql
-- Find user ID
SELECT id, email FROM auth.users WHERE email = 'matjosoft@gmail.com';

-- Set up test subscription (replace USER_ID with actual ID)
INSERT INTO user_subscriptions (user_id, tier, generation_limit, is_test_user)
VALUES ('USER_ID', 'test', -1, true)
ON CONFLICT (user_id) DO UPDATE
SET tier = 'test', generation_limit = -1, is_test_user = true;
```

## Migration Guide

### Running the Migration

1. **Development (Supabase CLI):**
   ```bash
   supabase db reset
   # or
   supabase migration up
   ```

2. **Production (Supabase Dashboard):**
   - Go to Database → Migrations
   - Upload `003_add_monetization.sql`
   - Click "Run migration"

### Post-Migration

1. **Set up test user:**
   ```bash
   npm run setup-test-user
   ```

2. **Verify tables:**
   - Check `user_subscriptions` table exists
   - Check `usage_logs` table exists
   - Verify RLS policies are enabled

3. **Existing users:**
   - Migration automatically gives existing users 30-day Pro trial
   - Verify by checking `user_subscriptions.trial_ends_at`

## Usage Tracking

### What Counts as Usage

All of these actions count as one generation:
- ✅ New song generation (`/api/generate`)
- ✅ Lyrics regeneration (`/api/regenerate`)
- ✅ Metatags regeneration (`/api/regenerate-metatags`)

### Billing Period

- **Duration:** 30 days from subscription start
- **Reset:** Automatic when period expires
- **Count:** Resets to 0 at the start of new period

### Test Users Exception

Test users (`is_test_user = true`):
- ❌ Do not count towards usage
- ❌ Do not have limits
- ❌ Do not see upgrade prompts
- ✅ Can generate unlimited songs

## Stripe Integration (Phase 2)

*Coming in Phase 2*

### Setup Process
1. Create Stripe account
2. Create Product: "Suno AI Music Assistant Pro"
3. Create Price: $5/month recurring
4. Add environment variables
5. Implement checkout flow
6. Implement webhooks

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

## API Response Format

### Success Response (with usage)
```json
{
  "songId": "uuid",
  "name": "My Song",
  "songs": [...],
  "usage": {
    "remaining": 95,
    "limit": 100,
    "tier": "pro",
    "periodEnd": "2025-12-10T00:00:00Z",
    "isTestUser": false
  }
}
```

### Error Response (limit reached)
```json
{
  "error": "You have reached your free tier limit. Please upgrade to Pro to continue generating songs.",
  "code": "USAGE_LIMIT_REACHED",
  "usage": {
    "remaining": 0,
    "limit": 5
  },
  "upgrade": {
    "message": "Upgrade to Pro for 100 generations per month",
    "tier": "pro",
    "price": "$5/month"
  }
}
```

## Troubleshooting

### User has no subscription
**Symptom:** API returns error about missing subscription

**Solution:**
```typescript
// Subscriptions are auto-created on first usage
// If missing, run:
await SubscriptionService.createSubscriptionServer(userId, 'free')
```

### Usage not resetting
**Symptom:** User still sees 0 remaining after period end

**Solution:**
```typescript
// Period reset is automatic
// Manual reset if needed:
await SubscriptionService.resetBillingPeriod(userId)
```

### Test user seeing limits
**Symptom:** matjosoft@gmail.com hits usage limits

**Solution:**
```bash
# Re-run setup script
npx tsx scripts/setup-test-user.ts

# Or manually:
# UPDATE user_subscriptions
# SET is_test_user = true, tier = 'test', generation_limit = -1
# WHERE user_id = (SELECT id FROM auth.users WHERE email = 'matjosoft@gmail.com')
```

## Future Enhancements

### Phase 3: Credit-Based System
- Track AI tokens used
- Charge per token instead of per song
- More granular usage control

### Phase 4: Additional Tiers
- Starter: $3/month, 25 songs
- Business: $15/month, 500 songs
- Enterprise: Custom pricing

### Phase 5: Features
- Annual billing (save 20%)
- Team/organization accounts
- One-time credit packs
- Usage analytics dashboard
- Email notifications

## Support

For issues or questions:
1. Check this documentation
2. Review the migration file: `supabase/migrations/003_add_monetization.sql`
3. Check service implementations in `lib/services/`
4. Contact: matjosoft@gmail.com
