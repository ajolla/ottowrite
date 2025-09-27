-- Additional Stripe-related database schema updates
-- Run this after your main database_setup.sql

-- Add Stripe-related columns to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster Stripe lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
ON user_profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_subscription
ON user_profiles(stripe_subscription_id);

-- Create subscription_events table for tracking Stripe events
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  subscription_id TEXT,
  customer_id TEXT,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT,
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for subscription events
CREATE INDEX IF NOT EXISTS idx_subscription_events_user
ON subscription_events(user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_events_stripe
ON subscription_events(stripe_event_id);

-- Create payment_history table for tracking all payments
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  description TEXT,
  tier TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for payment history
CREATE INDEX IF NOT EXISTS idx_payment_history_user
ON payment_history(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_status
ON payment_history(status);

-- Function to update usage limits based on tier
CREATE OR REPLACE FUNCTION update_user_tier_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Update usage limits based on new tier
  CASE NEW.tier
    WHEN 'free' THEN
      NEW.usage_limit := 10000;
    WHEN 'premium' THEN
      NEW.usage_limit := 1000000;
    WHEN 'enterprise' THEN
      NEW.usage_limit := -1; -- Unlimited
    ELSE
      NEW.usage_limit := 10000; -- Default to free tier limits
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update usage limits when tier changes
DROP TRIGGER IF EXISTS trigger_update_tier_limits ON user_profiles;
CREATE TRIGGER trigger_update_tier_limits
  BEFORE UPDATE OF tier ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tier_limits();

-- Function to reset monthly usage (called by cron or manually)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE user_profiles
  SET
    monthly_usage = 0,
    last_reset_date = NOW(),
    updated_at = NOW()
  WHERE last_reset_date < DATE_TRUNC('month', NOW());

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to track subscription event
CREATE OR REPLACE FUNCTION track_subscription_event(
  p_user_id UUID,
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_subscription_id TEXT DEFAULT NULL,
  p_customer_id TEXT DEFAULT NULL,
  p_amount INTEGER DEFAULT NULL,
  p_currency TEXT DEFAULT 'usd',
  p_status TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO subscription_events (
    user_id,
    stripe_event_id,
    event_type,
    subscription_id,
    customer_id,
    amount,
    currency,
    status,
    metadata
  ) VALUES (
    p_user_id,
    p_stripe_event_id,
    p_event_type,
    p_subscription_id,
    p_customer_id,
    p_amount,
    p_currency,
    p_status,
    p_metadata
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user subscription summary
CREATE OR REPLACE FUNCTION get_user_subscription_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', up.id,
    'tier', up.tier,
    'subscription_status', up.subscription_status,
    'monthly_usage', up.monthly_usage,
    'usage_limit', up.usage_limit,
    'usage_percentage',
      CASE
        WHEN up.usage_limit = -1 THEN 0
        ELSE ROUND((up.monthly_usage::DECIMAL / up.usage_limit::DECIMAL) * 100, 2)
      END,
    'last_reset_date', up.last_reset_date,
    'stripe_customer_id', up.stripe_customer_id,
    'stripe_subscription_id', up.stripe_subscription_id,
    'recent_payments', (
      SELECT json_agg(
        json_build_object(
          'amount', ph.amount,
          'currency', ph.currency,
          'status', ph.status,
          'description', ph.description,
          'created_at', ph.created_at
        )
      )
      FROM payment_history ph
      WHERE ph.user_id = p_user_id
      ORDER BY ph.created_at DESC
      LIMIT 5
    )
  ) INTO result
  FROM user_profiles up
  WHERE up.id = p_user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security policies for new tables
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Policy for subscription_events
CREATE POLICY "Users can view their own subscription events" ON subscription_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription events" ON subscription_events
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for payment_history
CREATE POLICY "Users can view their own payment history" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment history" ON payment_history
  FOR ALL USING (auth.role() = 'service_role');

-- Create some useful views
CREATE OR REPLACE VIEW user_subscription_stats AS
SELECT
  up.id,
  up.email,
  up.tier,
  up.subscription_status,
  up.monthly_usage,
  up.usage_limit,
  CASE
    WHEN up.usage_limit = -1 THEN 0
    ELSE ROUND((up.monthly_usage::DECIMAL / up.usage_limit::DECIMAL) * 100, 2)
  END as usage_percentage,
  up.stripe_customer_id,
  up.stripe_subscription_id,
  up.last_reset_date,
  COUNT(ph.id) as total_payments,
  COALESCE(SUM(ph.amount), 0) as total_paid
FROM user_profiles up
LEFT JOIN payment_history ph ON up.id = ph.user_id AND ph.status = 'succeeded'
GROUP BY up.id;

-- Comment on tables and important columns
COMMENT ON TABLE subscription_events IS 'Tracks all Stripe webhook events related to subscriptions';
COMMENT ON TABLE payment_history IS 'Records all payment transactions and their status';
COMMENT ON COLUMN user_profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN user_profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN user_profiles.subscription_status IS 'Current subscription status from Stripe';

-- Grant necessary permissions
GRANT SELECT ON user_subscription_stats TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;