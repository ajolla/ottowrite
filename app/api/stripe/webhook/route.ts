import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Update user profile with new tier
  const { error } = await supabase
    .from('user_profiles')
    .update({
      tier: tier,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update user profile:', error);
    return;
  }

  // Log the tier change
  await supabase
    .from('user_tier_changes')
    .insert({
      user_id: userId,
      from_tier: 'free', // Assuming upgrade from free
      to_tier: tier,
      changed_at: new Date().toISOString(),
      stripe_session_id: session.id,
    });

  console.log(`User ${userId} upgraded to ${tier} tier`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const tier = subscription.metadata?.tier;

  if (!userId) {
    console.error('Missing userId in subscription metadata:', subscription.id);
    return;
  }

  // Update user profile
  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      tier: tier || 'premium',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update user subscription:', error);
  }

  console.log(`Subscription created for user ${userId}: ${subscription.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by subscription ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!userProfile) {
      console.error('User not found for subscription:', subscription.id);
      return;
    }
  }

  // Update subscription status
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq(userId ? 'id' : 'stripe_subscription_id', userId || subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }

  console.log(`Subscription updated: ${subscription.id} - Status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Downgrade user to free tier
  const { error } = await supabase
    .from('user_profiles')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to downgrade user after subscription cancellation:', error);
  }

  console.log(`Subscription canceled: ${subscription.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    // Reset monthly usage for the user
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (userProfile) {
      await supabase
        .from('user_profiles')
        .update({
          monthly_usage: 0,
          last_reset_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id);

      console.log(`Monthly usage reset for user ${userProfile.id}`);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Payment failed for invoice: ${invoice.id}`);

  // Optionally, you could send notifications or take other actions
  // when a payment fails, such as sending an email to the customer
}