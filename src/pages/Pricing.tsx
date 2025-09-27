import { useState } from 'react';
import { PricingCard } from '@/components/billing/PricingCard';
import { useStripe } from '@/hooks/useStripe';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PricingProps {
  currentUser?: {
    id: string;
    tier: SubscriptionTier;
  };
  onBack?: () => void;
}

export function Pricing({ currentUser, onBack }: PricingProps) {
  const { createCheckoutSession, isLoading } = useStripe();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!currentUser) {
      // Redirect to sign in
      window.location.href = '/signin?redirect=/pricing';
      return;
    }

    if (tier === 'free') {
      // Handle free tier logic if needed
      return;
    }

    setSelectedTier(tier);
    await createCheckoutSession(
      currentUser.id,
      tier,
      `${window.location.origin}/dashboard?upgraded=true`,
      `${window.location.origin}/pricing`
    );
    setSelectedTier(null);
  };

  const tiers: SubscriptionTier[] = ['free', 'premium', 'enterprise'];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock the full power of AI-assisted writing with our flexible pricing plans.
            Start free and upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <PricingCard
              key={tier}
              tier={tier}
              currentTier={currentUser?.tier}
              isLoading={isLoading && selectedTier === tier}
              onSubscribe={handleSubscribe}
              popular={tier === 'premium'}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-left">
              <h3 className="text-lg font-semibold mb-2">What are tokens?</h3>
              <p className="text-muted-foreground">
                Tokens are units of text that AI models process. Roughly, 1 token equals 4 characters or 0.75 words.
                A typical page of text contains about 2,000 tokens.
              </p>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and billing is prorated accordingly.
              </p>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-semibold mb-2">What happens if I exceed my token limit?</h3>
              <p className="text-muted-foreground">
                Free users will be prompted to upgrade when approaching their limit. Premium and Enterprise
                users get warnings but can continue using the service with potential overage charges.
              </p>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground">
                We offer a 30-day money-back guarantee for all paid plans. Contact support if you're not
                satisfied with your subscription.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
          <p className="text-muted-foreground mb-6">
            Contact our sales team for enterprise-grade features, custom integrations, and volume discounts.
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}