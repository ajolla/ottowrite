import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Star,
  Zap,
  Check,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SupabaseAIUsageTracker } from '@/lib/ai-providers';
import { toast } from 'sonner';

interface TierFeatures {
  name: string;
  monthlyTokens: number;
  aiProviders: string[];
  features: string[];
  price: number;
  popular?: boolean;
}

const tiers: Record<string, TierFeatures> = {
  free: {
    name: 'Free',
    monthlyTokens: 10000,
    aiProviders: ['DeepSeek'],
    features: [
      'Basic AI writing assistance',
      'Limited story analysis',
      'Community support',
      '10K tokens per month'
    ],
    price: 0,
  },
  premium: {
    name: 'Premium',
    monthlyTokens: 1000000,
    aiProviders: ['OpenAI GPT-4', 'Claude-3'],
    features: [
      'Advanced AI models (GPT-4, Claude-3)',
      'Unlimited story analysis',
      'Priority processing',
      'Advanced character development',
      'Plot structure analysis',
      'Email support',
      '1M tokens per month'
    ],
    price: 29,
    popular: true,
  },
  enterprise: {
    name: 'Enterprise',
    monthlyTokens: -1, // Unlimited
    aiProviders: ['OpenAI GPT-4', 'Claude-3', 'Custom Models'],
    features: [
      'Unlimited AI usage',
      'Custom AI model training',
      'Team collaboration tools',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom integrations'
    ],
    price: 99,
  },
};

export const UserTierManager = () => {
  const { user, profile, updateProfile } = useAuth();
  const [usage, setUsage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const usageTracker = new SupabaseAIUsageTracker();

  useEffect(() => {
    if (user) {
      loadUsage();
    }
  }, [user]);

  const loadUsage = async () => {
    if (!user) return;

    try {
      const currentUsage = await usageTracker.getUserUsage(user.id);
      setUsage(currentUsage);
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  const handleUpgrade = async (newTier: string) => {
    if (!profile) return;

    setIsLoading(true);

    try {
      // In a real app, you'd integrate with a payment processor here
      const tierInfo = tiers[newTier];

      await updateProfile({
        tier: newTier as 'free' | 'premium' | 'enterprise',
        usage_limit: tierInfo.monthlyTokens,
      });

      toast.success(`Successfully upgraded to ${tierInfo.name}!`);
    } catch (error) {
      toast.error('Failed to upgrade plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTierInfo = (): TierFeatures => {
    return tiers[profile?.tier || 'free'];
  };

  const getUsagePercentage = (): number => {
    const currentTier = getCurrentTierInfo();
    if (currentTier.monthlyTokens === -1) return 0; // Unlimited
    return Math.min((usage / currentTier.monthlyTokens) * 100, 100);
  };

  const getUsageColor = (): string => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRemainingTokens = (): number => {
    const currentTier = getCurrentTierInfo();
    if (currentTier.monthlyTokens === -1) return Infinity;
    return Math.max(currentTier.monthlyTokens - usage, 0);
  };

  if (!profile) {
    return null;
  }

  const currentTier = getCurrentTierInfo();
  const usagePercentage = getUsagePercentage();

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {profile.tier === 'enterprise' && <Crown className="h-5 w-5 text-yellow-500" />}
              {profile.tier === 'premium' && <Star className="h-5 w-5 text-blue-500" />}
              {profile.tier === 'free' && <Zap className="h-5 w-5 text-green-500" />}
              <CardTitle>Current Plan: {currentTier.name}</CardTitle>
            </div>
            <Badge variant={profile.tier === 'enterprise' ? 'default' : profile.tier === 'premium' ? 'secondary' : 'outline'}>
              {profile.tier === 'free' ? 'Free' : `$${currentTier.price}/month`}
            </Badge>
          </div>
          <CardDescription>
            AI Provider: {currentTier.aiProviders.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Usage Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monthly Usage</span>
                <span className={`text-sm font-bold ${getUsageColor()}`}>
                  {currentTier.monthlyTokens === -1
                    ? `${usage.toLocaleString()} tokens (Unlimited)`
                    : `${usage.toLocaleString()} / ${currentTier.monthlyTokens.toLocaleString()} tokens`
                  }
                </span>
              </div>
              {currentTier.monthlyTokens !== -1 && (
                <>
                  <Progress value={usagePercentage} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{getRemainingTokens().toLocaleString()} tokens remaining</span>
                    <span>{Math.round(usagePercentage)}% used</span>
                  </div>
                </>
              )}
            </div>

            {/* Usage Warning */}
            {usagePercentage >= 75 && currentTier.monthlyTokens !== -1 && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  {usagePercentage >= 90
                    ? 'You\'re close to your monthly limit. Consider upgrading.'
                    : 'You\'ve used most of your monthly tokens.'
                  }
                </span>
              </div>
            )}

            {/* Current Features */}
            <div>
              <h4 className="font-medium mb-2">Your Features</h4>
              <div className="grid grid-cols-1 gap-1">
                {currentTier.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {profile.tier !== 'enterprise' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upgrade Your Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(tiers)
              .filter(([tier]) => {
                if (profile.tier === 'free') return tier !== 'free';
                if (profile.tier === 'premium') return tier === 'enterprise';
                return false;
              })
              .map(([tierKey, tierInfo]) => (
                <Card key={tierKey} className={`relative ${tierInfo.popular ? 'border-primary shadow-lg' : ''}`}>
                  {tierInfo.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        {tierKey === 'enterprise' && <Crown className="h-5 w-5 text-yellow-500" />}
                        {tierKey === 'premium' && <Star className="h-5 w-5 text-blue-500" />}
                        <span>{tierInfo.name}</span>
                      </CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${tierInfo.price}</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                      </div>
                    </div>
                    <CardDescription>
                      {tierInfo.monthlyTokens === -1
                        ? 'Unlimited AI usage'
                        : `${(tierInfo.monthlyTokens / 1000).toLocaleString()}K tokens/month`
                      }
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">AI Providers</h4>
                      <div className="flex flex-wrap gap-1">
                        {tierInfo.aiProviders.map((provider, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {provider}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <div className="space-y-1">
                        {tierInfo.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleUpgrade(tierKey)}
                      disabled={isLoading}
                      className="w-full"
                      variant={tierInfo.popular ? 'default' : 'outline'}
                    >
                      {isLoading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Upgrade to {tierInfo.name}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Usage Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Use the "Continue Writing" feature for longer content generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Select specific text for more targeted AI assistance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Premium users get access to more advanced AI models</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Usage resets at the beginning of each month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};