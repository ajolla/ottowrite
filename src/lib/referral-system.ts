import { createClient } from '@supabase/supabase-js';
import { InfluencerPartner, ReferralCode, ReferralConversion, ReferralClick } from '@/types/referral';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class ReferralSystemManager {
  // Generate unique referral code
  static generateReferralCode(baseName: string, existingCodes: string[] = []): string {
    const cleanName = baseName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const year = new Date().getFullYear().toString().slice(-2);

    // Try different variations until we find a unique one
    const variations = [
      `${cleanName}${year}`,
      `${cleanName.slice(0, 6)}${year}`,
      `${cleanName}${year}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
      `${cleanName.slice(0, 4)}${year}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    ];

    for (const code of variations) {
      if (!existingCodes.includes(code)) {
        return code;
      }
    }

    // Fallback: random code
    return `REF${Date.now().toString().slice(-6)}`;
  }

  // Create new influencer partner
  static async createInfluencerPartner(data: Omit<InfluencerPartner, 'id' | 'createdAt' | 'updatedAt' | 'totalEarnings' | 'pendingEarnings' | 'paidEarnings'>): Promise<InfluencerPartner> {
    const { data: partner, error } = await supabase
      .from('influencer_partners')
      .insert({
        ...data,
        total_earnings: 0,
        pending_earnings: 0,
        paid_earnings: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create influencer partner: ${error.message}`);
    return this.transformPartnerFromDb(partner);
  }

  // Create referral code for influencer
  static async createReferralCode(influencerId: string, customCode?: string, description?: string, maxUses?: number, expiresAt?: Date): Promise<ReferralCode> {
    // Get existing codes to ensure uniqueness
    const { data: existingCodes } = await supabase
      .from('referral_codes')
      .select('code');

    const existingCodeStrings = existingCodes?.map(c => c.code) || [];

    let code: string;
    if (customCode) {
      if (existingCodeStrings.includes(customCode.toUpperCase())) {
        throw new Error('Referral code already exists');
      }
      code = customCode.toUpperCase();
    } else {
      // Get influencer name for code generation
      const { data: partner } = await supabase
        .from('influencer_partners')
        .select('business_name, user_profiles(full_name)')
        .eq('id', influencerId)
        .single();

      const baseName = partner?.business_name || partner?.user_profiles?.full_name || 'INFLUENCER';
      code = this.generateReferralCode(baseName, existingCodeStrings);
    }

    const { data: referralCode, error } = await supabase
      .from('referral_codes')
      .insert({
        code,
        influencer_id: influencerId,
        status: 'active',
        description,
        max_uses: maxUses,
        current_uses: 0,
        expires_at: expiresAt?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create referral code: ${error.message}`);
    return this.transformCodeFromDb(referralCode);
  }

  // Track referral click
  static async trackReferralClick(
    code: string,
    ipAddress: string,
    userAgent: string,
    referer?: string,
    utmParams?: { source?: string; medium?: string; campaign?: string }
  ): Promise<{ success: boolean; trackingId?: string; error?: string }> {
    try {
      // Find referral code
      const { data: referralCode, error: codeError } = await supabase
        .from('referral_codes')
        .select('id, influencer_id, status, expires_at, max_uses, current_uses')
        .eq('code', code.toUpperCase())
        .single();

      if (codeError || !referralCode) {
        return { success: false, error: 'Invalid referral code' };
      }

      // Check if code is active and not expired
      if (referralCode.status !== 'active') {
        return { success: false, error: 'Referral code is not active' };
      }

      if (referralCode.expires_at && new Date(referralCode.expires_at) < new Date()) {
        return { success: false, error: 'Referral code has expired' };
      }

      if (referralCode.max_uses && referralCode.current_uses >= referralCode.max_uses) {
        return { success: false, error: 'Referral code has reached maximum uses' };
      }

      // Track the click
      const { data: click, error: clickError } = await supabase
        .from('referral_clicks')
        .insert({
          referral_code_id: referralCode.id,
          influencer_id: referralCode.influencer_id,
          ip_address: ipAddress,
          user_agent: userAgent,
          referer,
          utm_source: utmParams?.source,
          utm_medium: utmParams?.medium,
          utm_campaign: utmParams?.campaign,
          clicked_at: new Date().toISOString(),
          converted_to_signup: false,
        })
        .select('id')
        .single();

      if (clickError) throw clickError;

      return { success: true, trackingId: click.id };
    } catch (error) {
      console.error('Error tracking referral click:', error);
      return { success: false, error: 'Failed to track referral click' };
    }
  }

  // Process referral conversion (when user signs up or subscribes)
  static async processReferralConversion(
    userId: string,
    conversionType: 'signup' | 'subscription' | 'upgrade',
    subscriptionTier?: 'free' | 'premium' | 'enterprise',
    subscriptionId?: string
  ): Promise<{ success: boolean; conversionId?: string; commissionAmount?: number }> {
    try {
      // Find the most recent referral click for this user that hasn't been converted
      const { data: clickData, error: clickError } = await supabase
        .from('referral_clicks')
        .select(`
          id,
          referral_code_id,
          influencer_id,
          clicked_at,
          referral_codes!inner(
            id,
            code,
            influencer_partners!inner(
              id,
              commission_rate,
              status
            )
          )
        `)
        .eq('converted_to_signup', false)
        .order('clicked_at', { ascending: false })
        .limit(1);

      if (clickError || !clickData || clickData.length === 0) {
        return { success: false };
      }

      const click = clickData[0];
      const partner = click.referral_codes.influencer_partners;

      if (partner.status !== 'active') {
        return { success: false };
      }

      // Calculate commission based on conversion type
      let commissionAmount = 0;
      let conversionValue = 0;

      if (conversionType === 'signup') {
        commissionAmount = 0; // No commission for free signup
      } else if (conversionType === 'subscription' || conversionType === 'upgrade') {
        commissionAmount = partner.commission_rate; // $2.00 = 200 cents

        // Set conversion value based on subscription tier
        switch (subscriptionTier) {
          case 'premium':
            conversionValue = 2000; // $20/month
            break;
          case 'enterprise':
            conversionValue = 5000; // $50/month
            break;
          default:
            conversionValue = 0;
        }
      }

      // Create conversion record
      const { data: conversion, error: conversionError } = await supabase
        .from('referral_conversions')
        .insert({
          referral_code_id: click.referral_code_id,
          influencer_id: click.influencer_id,
          referred_user_id: userId,
          subscription_id: subscriptionId,
          conversion_type: conversionType,
          commission_amount: commissionAmount,
          commission_status: commissionAmount > 0 ? 'pending' : 'approved',
          subscription_tier: subscriptionTier || 'free',
          first_payment_date: conversionType === 'subscription' ? new Date().toISOString() : null,
          commission_eligible_until: conversionType === 'subscription' ?
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null, // 30 days
          conversion_value: conversionValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (conversionError) throw conversionError;

      // Mark click as converted
      await supabase
        .from('referral_clicks')
        .update({
          converted_to_signup: true,
          user_id: userId
        })
        .eq('id', click.id);

      // Update referral code usage count
      await supabase
        .from('referral_codes')
        .update({
          current_uses: supabase.rpc('increment_uses', { row_id: click.referral_code_id })
        })
        .eq('id', click.referral_code_id);

      // Update influencer earnings if there's a commission
      if (commissionAmount > 0) {
        await supabase
          .from('influencer_partners')
          .update({
            pending_earnings: supabase.rpc('add_pending_earnings', {
              partner_id: click.influencer_id,
              amount: commissionAmount
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', click.influencer_id);
      }

      return {
        success: true,
        conversionId: conversion.id,
        commissionAmount
      };
    } catch (error) {
      console.error('Error processing referral conversion:', error);
      return { success: false };
    }
  }

  // Helper methods for data transformation
  private static transformPartnerFromDb(dbPartner: any): InfluencerPartner {
    return {
      id: dbPartner.id,
      userId: dbPartner.user_id,
      status: dbPartner.status,
      partnerType: dbPartner.partner_type,
      contactEmail: dbPartner.contact_email,
      businessName: dbPartner.business_name,
      socialMedia: dbPartner.social_media || [],
      commissionRate: dbPartner.commission_rate,
      payoutMethod: dbPartner.payout_method,
      payoutDetails: dbPartner.payout_details || {},
      totalEarnings: dbPartner.total_earnings || 0,
      pendingEarnings: dbPartner.pending_earnings || 0,
      paidEarnings: dbPartner.paid_earnings || 0,
      approvedBy: dbPartner.approved_by,
      approvedAt: new Date(dbPartner.approved_at),
      createdAt: new Date(dbPartner.created_at),
      updatedAt: new Date(dbPartner.updated_at),
    };
  }

  private static transformCodeFromDb(dbCode: any): ReferralCode {
    return {
      id: dbCode.id,
      code: dbCode.code,
      influencerId: dbCode.influencer_id,
      status: dbCode.status,
      description: dbCode.description,
      maxUses: dbCode.max_uses,
      currentUses: dbCode.current_uses,
      expiresAt: dbCode.expires_at ? new Date(dbCode.expires_at) : undefined,
      createdAt: new Date(dbCode.created_at),
      updatedAt: new Date(dbCode.updated_at),
    };
  }
}