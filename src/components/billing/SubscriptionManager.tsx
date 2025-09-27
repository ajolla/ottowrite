import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Calendar, CreditCard, Download, Users } from 'lucide-react';
import { SubscriptionTier } from '@/lib/stripe';

interface SubscriptionManagerProps {
  userProfile: {
    id: string;
    tier: SubscriptionTier;
    monthlyUsage: number;
    usageLimit: number;
    subscriptionStatus?: string;
    nextBillingDate?: string;
    stripeCustomerId?: string;
  };
  onUpgrade: () => void;
  onManageBilling: () => void;
}

export function SubscriptionManager({
  userProfile,
  onUpgrade,
  onManageBilling
}: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const usagePercentage = userProfile.usageLimit === -1
    ? 0
    : Math.min((userProfile.monthlyUsage / userProfile.usageLimit) * 100, 100);

  const formatUsage = (usage: number) => {
    if (usage >= 1000000) return `${(usage / 1000000).toFixed(1)}M`;
    if (usage >= 1000) return `${(usage / 1000).toFixed(1)}K`;
    return usage.toString();
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'bg-gray-500';
      case 'premium': return 'bg-blue-500';
      case 'enterprise': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTierDisplayName = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'Free';
      case 'premium': return 'Premium';
      case 'enterprise': return 'Enterprise';
      default: return tier;
    }
  };

  const handleManageBilling = async () => {
    if (!userProfile.stripeCustomerId) {
      toast.error('No billing information found');
      return;
    }

    setIsLoading(true);
    try {
      await onManageBilling();
    } catch (error) {
      toast.error('Failed to open billing portal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Badge className={getTierColor(userProfile.tier)}>
              {getTierDisplayName(userProfile.tier)}
            </Badge>
          </CardTitle>
          <CardDescription>
            {userProfile.tier === 'free'
              ? 'Upgrade to unlock advanced AI models and features'
              : 'You have access to premium features'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Usage Stats */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Usage</span>
              <span>
                {formatUsage(userProfile.monthlyUsage)} / {
                  userProfile.usageLimit === -1 ? 'Unlimited' : formatUsage(userProfile.usageLimit)
                } tokens
              </span>
            </div>
            {userProfile.usageLimit !== -1 && (
              <Progress value={usagePercentage} className="h-2" />
            )}
            {usagePercentage > 80 && userProfile.tier === 'free' && (
              <p className="text-sm text-amber-600">
                You're approaching your monthly limit. Consider upgrading to continue using AI features.
              </p>
            )}
          </div>

          {/* Billing Info */}
          {userProfile.tier !== 'free' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Next billing date</span>
                </div>
                <span>
                  {userProfile.nextBillingDate
                    ? new Date(userProfile.nextBillingDate).toLocaleDateString()
                    : 'N/A'
                  }
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span>Status</span>
                </div>
                <Badge variant={userProfile.subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                  {userProfile.subscriptionStatus || 'Unknown'}
                </Badge>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {userProfile.tier === 'free' ? (
              <Button onClick={onUpgrade} className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={isLoading}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isLoading ? 'Loading...' : 'Manage Billing'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage</CardTitle>
          <CardDescription>
            Track your usage across different AI features
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatUsage(userProfile.monthlyUsage)}
              </div>
              <div className="text-sm text-muted-foreground">AI Generations</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {userProfile.tier === 'free' ? '5' : 'Unlimited'}
              </div>
              <div className="text-sm text-muted-foreground">Exports</div>
            </div>
          </div>

          {userProfile.tier === 'free' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <Download className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Export Limit</h4>
                  <p className="text-sm text-amber-700">
                    Free accounts are limited to 5 exports per month with watermarks.
                    Upgrade for unlimited watermark-free exports.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}