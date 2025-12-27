-- Add trial tier support to user_subscriptions

-- 1. Add trial_usage_count column to track total trial usage (not per-period)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS trial_usage_count INTEGER DEFAULT 0;

-- 2. Add trial_started_at for auditing when trial started
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;

-- 3. Update the tier constraint to include 'trial'
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_tier_check;

ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_tier_check
CHECK (tier IN ('free', 'pro', 'test', 'trial'));

-- 4. Create index for finding trial users efficiently
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial
ON user_subscriptions(tier) WHERE tier = 'trial';
