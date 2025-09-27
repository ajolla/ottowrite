# Referral System Implementation Guide

## Overview

This comprehensive referral system allows influencers and partners to earn $2 commissions for each user they refer who subscribes to premium plans. The system includes tracking, attribution, payout management, and detailed analytics.

## 🚀 Key Features Implemented

### 1. **Database Schema** (`src/types/referral.ts`)
- **InfluencerPartner**: Partner management with tiers and earnings tracking
- **ReferralCode**: Unique codes with usage limits and expiration
- **ReferralClick**: Click tracking with UTM parameter support
- **ReferralConversion**: Conversion tracking with commission calculations
- **PayoutRecord**: Payout management with multiple payment methods
- **ReferralAnalytics**: Performance metrics and reporting

### 2. **Core System** (`src/lib/referral-system.ts`)
- Referral code generation (auto or custom)
- Click tracking with fraud prevention
- Conversion processing with commission calculation
- Usage limits and expiration handling
- UTM parameter support for campaign tracking

### 3. **Payout Management** (`src/lib/payout-system.ts`)
- Automatic commission calculations
- Multi-method payouts (PayPal, Stripe, Bank Transfer)
- Bulk payout processing
- Auto-approval of conversions after 7 days
- Comprehensive payout reporting

### 4. **Admin Interface** (`src/components/admin/InfluencerPartnerManager.tsx`)
- Partner onboarding and management
- Referral code creation and monitoring
- Performance analytics dashboard
- Commission approval workflows
- Payout processing interface

### 5. **Influencer Dashboard** (`src/components/referral/InfluencerDashboard.tsx`)
- Real-time earnings tracking
- Referral code management
- Social media sharing tools
- Performance analytics
- Payout history

### 6. **Referral Landing Pages** (`app/ref/[code]/page.tsx`)
- Branded referral landing pages
- Attribution tracking
- Social proof and conversion optimization
- UTM parameter preservation

## 📋 Required Supabase Database Setup

### Tables to Create:

```sql
-- Influencer Partners
CREATE TABLE influencer_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  status TEXT NOT NULL DEFAULT 'active',
  partner_type TEXT NOT NULL DEFAULT 'influencer',
  contact_email TEXT NOT NULL,
  business_name TEXT,
  social_media JSONB DEFAULT '[]',
  commission_rate INTEGER NOT NULL DEFAULT 200,
  payout_method TEXT NOT NULL DEFAULT 'paypal',
  payout_details JSONB DEFAULT '{}',
  total_earnings INTEGER DEFAULT 0,
  pending_earnings INTEGER DEFAULT 0,
  paid_earnings INTEGER DEFAULT 0,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Codes
CREATE TABLE referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  influencer_id UUID REFERENCES influencer_partners(id),
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Clicks
CREATE TABLE referral_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID REFERENCES referral_codes(id),
  influencer_id UUID REFERENCES influencer_partners(id),
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

-- Referral Conversions
CREATE TABLE referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID REFERENCES referral_codes(id),
  influencer_id UUID REFERENCES influencer_partners(id),
  referred_user_id UUID REFERENCES user_profiles(id),
  subscription_id TEXT,
  conversion_type TEXT NOT NULL,
  commission_amount INTEGER NOT NULL,
  commission_status TEXT NOT NULL DEFAULT 'pending',
  subscription_tier TEXT,
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

-- Payout Records
CREATE TABLE payout_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID REFERENCES influencer_partners(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  payout_method TEXT NOT NULL,
  payout_details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  conversion_ids TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_clicks_code_id ON referral_clicks(referral_code_id);
CREATE INDEX idx_referral_conversions_influencer ON referral_conversions(influencer_id);
CREATE INDEX idx_payout_records_status ON payout_records(status);
```

### Required Database Functions:

```sql
-- Function to update influencer earnings
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

-- Function to increment referral code usage
CREATE OR REPLACE FUNCTION increment_uses(row_id UUID)
RETURNS INTEGER AS $$
BEGIN
  UPDATE referral_codes
  SET current_uses = current_uses + 1
  WHERE id = row_id;

  RETURN (SELECT current_uses FROM referral_codes WHERE id = row_id);
END;
$$ LANGUAGE plpgsql;
```

## 🔧 Environment Variables

Add to your `.env.local`:

```env
# PayPal Configuration (for payouts)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox # or 'live' for production

# Stripe Configuration (for payouts)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email Configuration (for notifications)
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=your_sendgrid_api_key
```

## 🎯 Implementation Steps

### Phase 1: Basic Setup (Week 1)
1. **Database Setup**: Create all tables and functions
2. **Admin Interface**: Deploy partner management
3. **Basic Tracking**: Implement referral code generation and click tracking
4. **Testing**: Validate end-to-end referral flow

### Phase 2: Enhanced Features (Week 2)
1. **Payout System**: Implement PayPal integration
2. **Analytics**: Add performance dashboards
3. **Automation**: Set up auto-approval workflows
4. **Email Notifications**: Partner welcome emails and payout notifications

### Phase 3: Advanced Features (Week 3)
1. **Fraud Prevention**: IP-based duplicate detection
2. **Multi-tier Commissions**: Different rates for different partners
3. **Recurring Commissions**: Monthly recurring for enterprise clients
4. **API Integration**: Webhooks for external systems

## 🛡️ Security Considerations

### 1. **Fraud Prevention**
- IP address tracking to prevent self-referrals
- Time-based windows for attribution
- Manual review for high-value conversions
- Rate limiting on referral code usage

### 2. **Data Protection**
- Encrypt sensitive payout information
- PCI compliance for payment processing
- GDPR compliance for EU users
- Regular audit logs

### 3. **Access Control**
- Admin-only access to partner management
- Partner-specific dashboard access
- API key authentication for webhooks
- Role-based permissions

## 📊 Key Metrics to Track

### Partner Performance
- Click-through rates by partner
- Conversion rates by referral source
- Average order value from referrals
- Partner lifetime value

### System Performance
- Total referral revenue
- Commission payout accuracy
- Attribution accuracy
- System uptime and response times

## 🔄 Workflow Examples

### New Partner Onboarding
1. Admin creates partner account in admin panel
2. System auto-generates default referral code
3. Welcome email sent with dashboard access
4. Partner receives branded referral materials

### Referral Conversion Flow
1. User clicks referral link (`/ref/PARTNER2024`)
2. System tracks click with attribution
3. User lands on branded signup page
4. Upon subscription, commission is calculated
5. Conversion enters approval queue
6. Auto-approval after 7 days or manual review
7. Commission added to partner's pending earnings

### Payout Process
1. Admin reviews pending commissions monthly
2. Bulk approve eligible conversions
3. Generate payout records for each partner
4. Process payments via PayPal/Stripe
5. Update partner earnings and send notifications

## 🚀 Recommended Next Steps

### Immediate (This Week)
1. **Set up database tables** using provided SQL
2. **Deploy admin interface** for partner management
3. **Test referral flow** end-to-end
4. **Create first test partner** and referral codes

### Short Term (Next Month)
1. **Integrate PayPal** for automated payouts
2. **Add email notifications** for key events
3. **Implement fraud prevention** measures
4. **Create partner onboarding documentation**

### Long Term (Next Quarter)
1. **Advanced analytics** and reporting
2. **Mobile app integration** for referral tracking
3. **Tiered commission structure** based on performance
4. **API for third-party integrations**

## 📞 Support and Maintenance

### Monitoring
- Set up alerts for failed payouts
- Monitor conversion attribution accuracy
- Track system performance metrics
- Regular fraud pattern analysis

### Partner Support
- Monthly performance reports
- Marketing material templates
- Best practices documentation
- Dedicated support channel

This referral system provides a robust foundation for scaling your influencer partner program while maintaining transparency, accuracy, and ease of use for both admins and partners.