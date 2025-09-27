import { NextRequest, NextResponse } from 'next/server';
import { ReferralSystemManager } from '@/lib/referral-system';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: partners, error } = await supabase
      .from('influencer_partners')
      .select(`
        *,
        user_profiles!inner(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(partners || []);

  } catch (error) {
    console.error('Get partners error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partnerData = await request.json();

    // Validate required fields
    if (!partnerData.contactEmail || !partnerData.businessName) {
      return NextResponse.json({
        error: 'Contact email and business name are required'
      }, { status: 400 });
    }

    // Create user profile first if it doesn't exist
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', partnerData.contactEmail)
      .single();

    let userId = existingUser?.id;

    if (!userId) {
      // Create user profile for the partner
      const { data: newUser, error: userError } = await supabase
        .from('user_profiles')
        .insert({
          email: partnerData.contactEmail,
          full_name: partnerData.businessName,
          tier: 'free',
          usage_count: 0,
          usage_limit: 10000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (userError) throw userError;
      userId = newUser.id;
    }

    // Create influencer partner
    const partner = await ReferralSystemManager.createInfluencerPartner({
      userId,
      status: 'active',
      partnerType: partnerData.partnerType || 'influencer',
      contactEmail: partnerData.contactEmail,
      businessName: partnerData.businessName,
      socialMedia: partnerData.socialMedia || [],
      commissionRate: partnerData.commissionRate || 200, // $2.00
      payoutMethod: partnerData.payoutMethod || 'paypal',
      payoutDetails: partnerData.payoutDetails || {},
      approvedBy: 'admin', // In real app, get from auth
      approvedAt: new Date()
    });

    // Auto-create a default referral code
    await ReferralSystemManager.createReferralCode(
      partner.id,
      undefined, // Auto-generate
      'Default referral code'
    );

    return NextResponse.json(partner);

  } catch (error) {
    console.error('Create partner error:', error);
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}