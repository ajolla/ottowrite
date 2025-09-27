import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/stripe';

interface PricingCardProps {
  tier: SubscriptionTier;
  currentTier?: SubscriptionTier;
  isLoading?: boolean;
  onSubscribe: (tier: SubscriptionTier) => void;
  popular?: boolean;
}

export function PricingCard({
  tier,
  currentTier,
  isLoading,
  onSubscribe,
  popular = false
}: PricingCardProps) {
  const plan = SUBSCRIPTION_PLANS[tier];
  const isCurrentTier = currentTier === tier;
  const isUpgrade = currentTier === 'free' && tier !== 'free';
  const isDowngrade = currentTier === 'enterprise' && tier !== 'enterprise';

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${(price / 100).toFixed(0)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens === -1) return 'Unlimited';
    if (tokens >= 1000000) return `${tokens / 1000000}M`;
    if (tokens >= 1000) return `${tokens / 1000}K`;
    return tokens.toString();
  };

  return (
    <Card className={`relative ${popular ? 'border-primary ring-2 ring-primary' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant="default">Most Popular</Badge>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
          {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Monthly Tokens</div>
          <div className="text-lg font-semibold">{formatTokens(plan.tokens)}</div>
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentTier ? "outline" : "default"}
          disabled={isCurrentTier || isLoading}
          onClick={() => onSubscribe(tier)}
        >
          {isLoading ? (
            "Processing..."
          ) : isCurrentTier ? (
            "Current Plan"
          ) : tier === 'free' ? (
            "Get Started"
          ) : isUpgrade ? (
            "Upgrade Now"
          ) : isDowngrade ? (
            "Downgrade"
          ) : (
            "Subscribe"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}