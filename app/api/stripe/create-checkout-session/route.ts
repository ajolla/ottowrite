import { NextRequest, NextResponse } from 'next/server';
import { stripe, SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, tier, successUrl, cancelUrl } = await request.json();

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (tier === 'free') {
      return NextResponse.json(
        { error: 'Cannot create checkout session for free tier' },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan || !plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Get or create user profile
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customerId = userProfile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          userId: userId,
        },
      });

      customerId = customer.id;

      // Update user profile with Stripe customer ID
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: userId,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          tier: tier,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}