-- Add monetization tables for subscription management and usage tracking

-- User Subscriptions Table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Subscription tier
  tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'test')),

  -- Stripe integration
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_price_id VARCHAR(255),

  -- Billing cycle
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,

  -- Usage limits (-1 means unlimited)
  generation_limit INTEGER NOT NULL DEFAULT 5,

  -- Trial management
  trial_ends_at TIMESTAMP WITH TIME ZONE,

  -- Test user flag (for development/testing purposes)
  is_test_user BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);

-- Usage Logs Table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Usage details
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('generate', 'regenerate_lyrics', 'regenerate_metatags')),
  song_id UUID REFERENCES songs(id) ON DELETE SET NULL,

  -- AI usage metadata (for future credit-based system)
  tokens_used INTEGER,
  model_used VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for usage_logs
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_user_period ON usage_logs(user_id, created_at);
CREATE INDEX idx_usage_logs_action_type ON usage_logs(action_type);

-- Row Level Security (RLS) policies for user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot directly insert/update/delete subscriptions (handled by API)
-- This prevents users from manipulating their own subscription data

-- Row Level Security (RLS) policies for usage_logs
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage logs
CREATE POLICY "Users can view own usage"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot directly insert/update/delete usage logs (handled by API)

-- Triggers to auto-update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create default subscription for existing users
-- Give them a 30-day trial of Pro tier
INSERT INTO user_subscriptions (user_id, tier, generation_limit, trial_ends_at, current_period_start, current_period_end)
SELECT
  id,
  'pro',
  100,
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Set up test user (matjosoft@gmail.com) with unlimited access
-- This will be updated after user is created if not exists yet
-- The application will handle this via a migration script
