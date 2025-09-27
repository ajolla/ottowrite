import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Tier configurations
const TIER_LIMITS = {
  free: 10000,
  premium: 1000000,
  enterprise: -1, // Unlimited
};

export async function POST(request: NextRequest) {
  try {
    const { userId, newTier, paymentToken } = await request.json();

    // Validate request
    if (!userId || !newTier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['free', 'premium', 'enterprise'].includes(newTier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow downgrading to free (in a real app, you'd handle this properly)
    if (newTier === 'free' && currentUser.tier !== 'free') {
      return NextResponse.json({ error: 'Cannot downgrade to free tier' }, { status: 400 });
    }

    // This endpoint is now primarily for free tier management
    // Paid tier upgrades should go through Stripe checkout
    if (newTier !== 'free') {
      return NextResponse.json({
        error: 'Paid tier upgrades must go through Stripe checkout',
        redirectTo: '/pricing'
      }, { status: 400 });
    }

    // Update user tier
    const { data: updatedUser, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        tier: newTier,
        usage_limit: TIER_LIMITS[newTier as keyof typeof TIER_LIMITS],
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update user tier' }, { status: 500 });
    }

    // Log the upgrade
    await supabase
      .from('user_tier_changes')
      .insert({
        user_id: userId,
        from_tier: currentUser.tier,
        to_tier: newTier,
        changed_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Successfully upgraded to ${newTier} tier`,
    });

  } catch (error) {
    console.error('Upgrade API error:', error);
    return NextResponse.json(
      { error: 'Failed to process upgrade' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // Get user's current tier and usage
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's usage history
    const { data: usageHistory, error: usageError } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      user,
      usageHistory: usageHistory || [],
    });

  } catch (error) {
    console.error('User info API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}