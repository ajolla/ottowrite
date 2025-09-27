import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AdminReferralOverview } from '@/types/referral';

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

    // Get overview statistics
    const [
      partnersResult,
      conversionsResult,
      commissionsResult,
      payoutsResult
    ] = await Promise.all([
      // Total and active partners
      supabase
        .from('influencer_partners')
        .select('id, status')
        .then(({ data, error }) => {
          if (error) throw error;
          return {
            total: data?.length || 0,
            active: data?.filter(p => p.status === 'active').length || 0
          };
        }),

      // Total conversions
      supabase
        .from('referral_conversions')
        .select('id')
        .then(({ data, error }) => {
          if (error) throw error;
          return data?.length || 0;
        }),

      // Total commissions paid
      supabase
        .from('referral_conversions')
        .select('commission_amount')
        .eq('commission_status', 'paid')
        .then(({ data, error }) => {
          if (error) throw error;
          return data?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
        }),

      // Pending payouts
      supabase
        .from('payout_records')
        .select('amount')
        .eq('status', 'pending')
        .then(({ data, error }) => {
          if (error) throw error;
          return data?.reduce((sum, p) => sum + p.amount, 0) || 0;
        })
    ]);

    // Get top performers
    const { data: topPerformers } = await supabase
      .from('influencer_partners')
      .select('*')
      .order('total_earnings', { ascending: false })
      .limit(5);

    // Get recent activity (last 10 conversions and clicks)
    const { data: recentConversions } = await supabase
      .from('referral_conversions')
      .select(`
        *,
        influencer_partners!inner(business_name),
        user_profiles!inner(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const overview: AdminReferralOverview = {
      totalPartners: partnersResult.total,
      activePartners: partnersResult.active,
      totalConversions: conversionsResult,
      totalCommissionsPaid: commissionsResult,
      pendingPayouts: payoutsResult,
      topPerformers: topPerformers || [],
      recentActivity: recentConversions || []
    };

    return NextResponse.json(overview);

  } catch (error) {
    console.error('Admin referral overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral overview' },
      { status: 500 }
    );
  }
}