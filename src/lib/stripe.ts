import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    tokens: 10000,
    features: ['DeepSeek API', 'Basic AI tools', 'Limited exports'],
    stripePriceId: null,
  },
  premium: {
    name: 'Premium',
    price: 2900, // $29.00 in cents
    tokens: 1000000,
    features: ['OpenAI GPT-4', 'Anthropic Claude-3', 'Advanced AI tools', 'Unlimited exports', 'Priority support'],
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
  },
  enterprise: {
    name: 'Enterprise',
    price: 9900, // $99.00 in cents
    tokens: -1, // Unlimited
    features: ['All AI providers', 'Custom integrations', 'Team collaboration', 'Priority support', 'Custom branding'],
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS;

export async function createCustomer(email: string, name?: string) {
  return await stripe.customers.create({
    email,
    name,
  });
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  metadata?: Record<string, string>
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata,
  });
}

export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId?: string,
  metadata?: Record<string, string>
) {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

export async function updateSubscription(
  subscriptionId: string,
  priceId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: priceId,
    }],
    payment_behavior: 'pending_if_incomplete',
  });
}

export async function getCustomerSubscriptions(customerId: string) {
  return await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
  });
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function getInvoice(invoiceId: string) {
  return await stripe.invoices.retrieve(invoiceId);
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}