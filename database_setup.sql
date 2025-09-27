-- Referral System Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Influencer Partners Table
CREATE TABLE IF NOT EXISTS influencer_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  partner_type TEXT NOT NULL DEFAULT 'influencer' CHECK (partner_type IN ('influencer', 'affiliate', 'brand_ambassador')),
  contact_email TEXT NOT NULL,
  business_name TEXT,
  social_media JSONB DEFAULT '[]'::jsonb,
  commission_rate INTEGER NOT NULL DEFAULT 200, -- $2.00 in cents
  payout_method TEXT NOT NULL DEFAULT 'paypal' CHECK (payout_method IN ('paypal', 'stripe', 'bank_transfer')),
  payout_details JSONB DEFAULT '{}'::jsonb,
  total_earnings INTEGER DEFAULT 0,
  pending_earnings INTEGER DEFAULT 0,
  paid_earnings INTEGER DEFAULT 0,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  influencer_id UUID REFERENCES influencer_partners(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  description TEXT,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Referral Clicks Table
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,
  influencer_id UUID REFERENCES influencer_partners(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  referer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_to_signup BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES user_profiles(id)
);

-- 4. Referral Conversions Table
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID REFERENCES referral_codes(id),
  influencer_id UUID REFERENCES influencer_partners(id),
  referred_user_id UUID REFERENCES user_profiles(id),
  subscription_id TEXT,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('signup', 'subscription', 'upgrade')),
  commission_amount INTEGER NOT NULL,
  commission_status TEXT NOT NULL DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
  first_payment_date TIMESTAMP WITH TIME ZONE,
  commission_eligible_until TIMESTAMP WITH TIME ZONE,
  conversion_value INTEGER DEFAULT 0,
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  payout_record_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payout Records Table
CREATE TABLE IF NOT EXISTS payout_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID REFERENCES influencer_partners(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  payout_method TEXT NOT NULL CHECK (payout_method IN ('paypal', 'stripe', 'bank_transfer')),
  payout_details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transaction_id TEXT,
  conversion_ids TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_influencer ON referral_codes(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code_id ON referral_clicks(referral_code_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_influencer ON referral_clicks(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_influencer ON referral_conversions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_status ON referral_conversions(commission_status);
CREATE INDEX IF NOT EXISTS idx_payout_records_status ON payout_records(status);
CREATE INDEX IF NOT EXISTS idx_payout_records_influencer ON payout_records(influencer_id);

-- 7. Helper Functions
CREATE OR REPLACE FUNCTION update_influencer_earnings(
  influencer_id UUID,
  pending_delta INTEGER,
  paid_delta INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE influencer_partners
  SET
    pending_earnings = pending_earnings + pending_delta,
    paid_earnings = paid_earnings + paid_delta,
    total_earnings = total_earnings + pending_delta + paid_delta,
    updated_at = NOW()
  WHERE id = influencer_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_uses(row_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE referral_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = row_id;

  SELECT current_uses INTO new_count
  FROM referral_codes
  WHERE id = row_id;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Add Pending Earnings Function for real-time calculations
CREATE OR REPLACE FUNCTION add_pending_earnings(partner_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_pending INTEGER;
BEGIN
  UPDATE influencer_partners
  SET pending_earnings = pending_earnings + amount,
      total_earnings = total_earnings + amount,
      updated_at = NOW()
  WHERE id = partner_id;

  SELECT pending_earnings INTO new_pending
  FROM influencer_partners
  WHERE id = partner_id;

  RETURN new_pending;
END;
$$ LANGUAGE plpgsql;

-- 9. Enable Row Level Security (Optional but recommended)
ALTER TABLE influencer_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_records ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS Policies (Adjust based on your auth setup)
-- Admin can see everything
CREATE POLICY "Admin full access on influencer_partners" ON influencer_partners
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access on referral_codes" ON referral_codes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Influencers can only see their own data
CREATE POLICY "Influencers see own data" ON influencer_partners
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Influencers see own codes" ON referral_codes
  FOR SELECT USING (influencer_id IN (
    SELECT id FROM influencer_partners WHERE user_id = auth.uid()
  ));

-- Public can read active referral codes for validation
CREATE POLICY "Public can read active codes" ON referral_codes
  FOR SELECT USING (status = 'active');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Referral system database setup completed successfully!';
  RAISE NOTICE 'Tables created: influencer_partners, referral_codes, referral_clicks, referral_conversions, payout_records';
  RAISE NOTICE 'Next step: Add admin interface to your app navigation';
END $$;