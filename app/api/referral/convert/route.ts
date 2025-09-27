import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReferralSystemManager } from '@/lib/referral-system';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { userId, conversionType, subscriptionTier, subscriptionId } = await request.json();

    if (!userId || !conversionType) {
      return NextResponse.json({
        error: 'User ID and conversion type are required'
      }, { status: 400 });
    }

    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the user exists
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await ReferralSystemManager.processReferralConversion(
      userId,
      conversionType,
      subscriptionTier,
      subscriptionId
    );

    if (!result.success) {
      // This is okay - not all users come from referrals
      return NextResponse.json({
        success: false,
        message: 'No referral attribution found'
      });
    }

    return NextResponse.json({
      success: true,
      conversionId: result.conversionId,
      commissionAmount: result.commissionAmount,
      message: result.commissionAmount && result.commissionAmount > 0
        ? `Referral commission of $${(result.commissionAmount / 100).toFixed(2)} credited`
        : 'Referral conversion tracked'
    });

  } catch (error) {
    console.error('Referral conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to process referral conversion' },
      { status: 500 }
    );
  }
}