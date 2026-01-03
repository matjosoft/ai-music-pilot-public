Admin Management (Supabase SQL Editor)
Convert a free user to trial:

-- First, find the user ID by email:
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Then convert to trial (replace USER_UUID_HERE):
UPDATE user_subscriptions
SET
  tier = 'trial',
  generation_limit = 20,
  trial_ends_at = NOW() + INTERVAL '14 days',
  trial_started_at = NOW(),
  trial_usage_count = 0
WHERE user_id = 'USER_UUID_HERE' AND tier = 'free';
View all trial users:

SELECT u.email, s.tier, s.trial_usage_count, s.generation_limit, s.trial_ends_at
FROM user_subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.tier = 'trial'
ORDER BY s.trial_ends_at;
Find expired/exhausted trials:

SELECT u.email, s.* FROM user_subscriptions s
JOIN auth.users u ON s.user_id = u.id
WHERE s.tier = 'trial'
AND (s.trial_ends_at < NOW() OR s.trial_usage_count >= s.generation_limit);