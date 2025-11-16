# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe payment processing for AI Music Pilot.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to your `.env.local` file

## Step 1: Get Stripe API Keys

### Test Mode (Development)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)

### Live Mode (Production)

1. Complete Stripe account verification
2. Go to https://dashboard.stripe.com/apikeys
3. Copy your **Publishable key** (starts with `pk_live_`)
4. Copy your **Secret key** (starts with `sk_live_`)

## Step 2: Create a Product and Price

1. Go to https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**
3. Fill in the details:
   - **Name:** AI Music Pilot Pro
   - **Description:** 100 song generations per month
   - **Pricing:** Recurring
   - **Price:** $5.00
   - **Billing period:** Monthly
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_`)

## Step 3: Set Up Webhooks

### Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the **webhook signing secret** (starts with `whsec_`)

### Production

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://yourdomain.com/api/stripe/webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRO_PRICE_ID=price_your_price_id_here

# Optional: Site URL (for redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production Environment Variables

For production, use the **live** keys and update `NEXT_PUBLIC_SITE_URL`:

```env
# Stripe Keys (Live Mode)
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRO_PRICE_ID=price_your_price_id_here

# Production Site URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Step 5: Enable Customer Portal

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Click **"Activate test link"** or configure custom settings
3. Enable:
   - ✅ Cancel subscriptions
   - ✅ Update payment method
   - ✅ View invoice history

## Step 6: Test the Integration

### Test Cards

Stripe provides test card numbers for development:

| Scenario | Card Number | Expiry | CVC | ZIP |
|----------|-------------|--------|-----|-----|
| Success | 4242 4242 4242 4242 | Any future date | Any 3 digits | Any |
| Decline | 4000 0000 0000 0002 | Any future date | Any 3 digits | Any |
| 3D Secure | 4000 0027 6000 3184 | Any future date | Any 3 digits | Any |

### Testing Flow

1. **Sign up** with a new account (not the test user)
2. **Generate 5 songs** to hit the free limit
3. **Click "Upgrade to Pro"** on the limit prompt
4. **Complete checkout** with test card `4242 4242 4242 4242`
5. **Verify** you're upgraded to Pro (100 generations)
6. **Test customer portal** - Click "Manage Subscription"
7. **Cancel subscription** in the portal
8. **Verify** downgrade happens

### Webhook Testing

With Stripe CLI running:

```bash
# Terminal 1: Run your app
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Watch the webhook events in the Stripe CLI output.

## Step 7: Go Live

### Checklist

- [ ] Complete Stripe account verification
- [ ] Create live product and price
- [ ] Update environment variables with live keys
- [ ] Configure live webhook endpoint
- [ ] Test with a real card (use your own)
- [ ] Monitor Stripe Dashboard for payments

### Switch to Live Mode

1. Update `.env.local` or environment variables with **live** keys
2. Update `STRIPE_PRO_PRICE_ID` with the **live** price ID
3. Deploy your application
4. Test with a real payment (refund it after testing)

## Troubleshooting

### Webhook Not Working

**Problem:** Payments complete but subscription doesn't update

**Solution:**
1. Check webhook endpoint is correct: `/api/stripe/webhook`
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly
3. Check webhook events are configured in Stripe Dashboard
4. View webhook logs in Stripe Dashboard → Webhooks → Click endpoint → "Events"

### Checkout Session Fails

**Problem:** "Failed to create checkout session"

**Solution:**
1. Verify `STRIPE_SECRET_KEY` is set
2. Verify `STRIPE_PRO_PRICE_ID` is correct
3. Check console for detailed error messages
4. Ensure price is set to "Recurring" mode

### Customer Portal Not Loading

**Problem:** "Failed to create portal session"

**Solution:**
1. Activate the Customer Portal in Stripe Dashboard
2. Verify user has a `stripe_customer_id` in database
3. Check console for detailed error messages

### RLS Policy Errors

**Problem:** "new row violates row-level security policy"

**Solution:**
- The service role client should bypass RLS automatically
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check that `createServiceRoleClient()` is being used for subscription updates

## Security Notes

### Environment Variables

**Never commit** these to version control:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

**Safe to commit:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (public key)
- `NEXT_PUBLIC_SITE_URL`

### Webhook Security

- Webhook signature verification is **required**
- Never skip the `stripe.webhooks.constructEvent()` call
- Always validate the webhook secret

### Service Role Key

- Only used in server-side API routes
- Bypasses Row-Level Security
- Never expose to client-side code

## Monitoring

### Stripe Dashboard

Monitor your subscription business:
- **Payments:** https://dashboard.stripe.com/payments
- **Subscriptions:** https://dashboard.stripe.com/subscriptions
- **Customers:** https://dashboard.stripe.com/customers
- **Webhooks:** https://dashboard.stripe.com/webhooks

### Logs to Monitor

- Successful checkouts
- Failed payments
- Subscription cancellations
- Webhook processing errors

## Support

### Stripe Resources

- **Documentation:** https://stripe.com/docs
- **API Reference:** https://stripe.com/docs/api
- **Support:** https://support.stripe.com
- **Test Cards:** https://stripe.com/docs/testing

### Contact

For issues with this integration, contact: matjosoft@gmail.com
