// Referral System Types
export interface InfluencerPartner {
  id: string;
  userId: string; // Links to user_profiles
  status: 'active' | 'inactive' | 'suspended';
  partnerType: 'influencer' | 'affiliate' | 'brand_ambassador';
  contactEmail: string;
  businessName?: string;
  socialMedia: {
    platform: 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin' | 'other';
    handle: string;
    followers?: number;
  }[];
  commissionRate: number; // $2.00 = 200 (stored in cents)
  payoutMethod: 'paypal' | 'stripe' | 'bank_transfer';
  payoutDetails: Record<string, string>; // PayPal email, bank details, etc.
  totalEarnings: number; // In cents
  pendingEarnings: number; // In cents
  paidEarnings: number; // In cents
  approvedBy: string; // Admin user ID
  approvedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralCode {
  id: string;
  code: string; // Unique referral code (e.g., "JOHN2024")
  influencerId: string;
  status: 'active' | 'inactive' | 'expired';
  description?: string; // Optional description for tracking campaigns
  maxUses?: number; // Optional limit on total uses
  currentUses: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralClick {
  id: string;
  referralCodeId: string;
  influencerId: string;
  ipAddress: string;
  userAgent: string;
  referer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  clickedAt: Date;
  convertedToSignup: boolean;
  userId?: string; // Set when user signs up
}

export interface ReferralConversion {
  id: string;
  referralCodeId: string;
  influencerId: string;
  referredUserId: string;
  subscriptionId?: string;
  conversionType: 'signup' | 'subscription' | 'upgrade';
  commissionAmount: number; // In cents
  commissionStatus: 'pending' | 'approved' | 'paid' | 'cancelled';
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  firstPaymentDate?: Date;
  commissionEligibleUntil?: Date; // For recurring commissions
  conversionValue: number; // Total value of the conversion
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutRecord {
  id: string;
  influencerId: string;
  amount: number; // In cents
  currency: 'USD';
  payoutMethod: 'paypal' | 'stripe' | 'bank_transfer';
  payoutDetails: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  conversionIds: string[]; // Array of conversion IDs included in this payout
  scheduledFor?: Date;
  processedAt?: Date;
  failureReason?: string;
  processedBy: string; // Admin user ID
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralAnalytics {
  influencerId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  periodStart: Date;
  periodEnd: Date;
  metrics: {
    clicks: number;
    signups: number;
    conversions: number;
    conversionRate: number;
    totalEarnings: number;
    pendingEarnings: number;
    averageOrderValue: number;
    topReferralSource?: string;
  };
  generatedAt: Date;
}

// Utility types for API responses
export interface ReferralDashboardData {
  partner: InfluencerPartner;
  activeCodes: ReferralCode[];
  recentConversions: ReferralConversion[];
  analytics: {
    thisMonth: ReferralAnalytics;
    lastMonth: ReferralAnalytics;
    allTime: ReferralAnalytics;
  };
  payoutHistory: PayoutRecord[];
}

export interface AdminReferralOverview {
  totalPartners: number;
  activePartners: number;
  totalConversions: number;
  totalCommissionsPaid: number;
  pendingPayouts: number;
  topPerformers: InfluencerPartner[];
  recentActivity: (ReferralConversion | ReferralClick)[];
}