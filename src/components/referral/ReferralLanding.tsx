'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Star,
  Gift,
  Users,
  Clock,
  CheckCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralLandingProps {
  code: string;
  utmParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
}

interface ReferralInfo {
  code: string;
  influencerName: string;
  influencerAvatar?: string;
  description?: string;
  isValid: boolean;
  specialOffer?: {
    title: string;
    description: string;
    validUntil?: string;
  };
}

export function ReferralLanding({ code, utmParams }: ReferralLandingProps) {
  const router = useRouter();
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    validateAndTrackReferral();
  }, [code]);

  const validateAndTrackReferral = async () => {
    try {
      setIsLoading(true);

      // First, track the referral click
      const trackResponse = await fetch('/api/referral/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          utmParams
        })
      });

      if (!trackResponse.ok) {
        const error = await trackResponse.json();
        throw new Error(error.error || 'Invalid referral code');
      }

      // Get referral info for display
      const infoResponse = await fetch(`/api/referral/info/${code}`);
      if (infoResponse.ok) {
        const info = await infoResponse.json();
        setReferralInfo(info);
      } else {
        // Fallback info if we can track but can't get details
        setReferralInfo({
          code: code.toUpperCase(),
          influencerName: 'OttoWrite Partner',
          isValid: true,
          description: 'You\'ve been referred by one of our trusted partners!'
        });
      }
    } catch (error) {
      console.error('Referral validation error:', error);
      toast.error('Invalid or expired referral code');

      // Redirect to normal signup after 3 seconds
      setTimeout(() => {
        router.push('/signup');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsTracking(true);

    // Add referral parameters to signup URL
    const signupUrl = new URL('/signup', window.location.origin);
    signupUrl.searchParams.set('ref', code);

    // Preserve UTM parameters
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) signupUrl.searchParams.set(key, value);
    });

    router.push(signupUrl.toString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Validating Referral...</h3>
              <p className="text-muted-foreground">
                Please wait while we process your referral code.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!referralInfo?.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Invalid Referral Code</h3>
              <p className="text-muted-foreground mb-4">
                The referral code "{code}" is invalid or has expired. You'll be redirected to our signup page.
              </p>
              <Button onClick={() => router.push('/signup')}>
                Continue to Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">OttoWrite AI</span>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Gift className="h-4 w-4 mr-1" />
              Referral Link
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column - Referral Info */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/20 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={referralInfo.influencerAvatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {referralInfo.influencerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">
                      You're invited by {referralInfo.influencerName}!
                    </CardTitle>
                    <CardDescription className="text-base">
                      {referralInfo.description || "Join the AI-powered writing revolution"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Referral Code</p>
                    <p className="text-2xl font-bold font-mono text-primary">{referralInfo.code}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Special Offer Card */}
            {referralInfo.specialOffer && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center">
                    <Gift className="h-5 w-5 mr-2" />
                    {referralInfo.specialOffer.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 mb-2">{referralInfo.specialOffer.description}</p>
                  {referralInfo.specialOffer.validUntil && (
                    <div className="flex items-center text-sm text-green-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Valid until {new Date(referralInfo.specialOffer.validUntil).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Features List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What you'll get with OttoWrite AI:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>AI-powered writing assistance for any genre</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Advanced story analysis and feedback</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Character and plot development tools</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Real-time collaboration features</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Export to multiple formats</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Call to Action */}
          <div className="space-y-6">
            <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-blue-500/5">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary">
                  Start Your Writing Journey
                </CardTitle>
                <CardDescription className="text-lg">
                  Join thousands of writers who use AI to enhance their creativity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                    <Gift className="h-4 w-4" />
                    <span>Special referral benefits included</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    size="lg"
                    className="w-full text-lg h-12"
                    onClick={handleSignUp}
                    disabled={isTracking}
                  >
                    {isTracking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Users className="h-5 w-5 mr-2" />
                        Join OttoWrite AI Now
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    By clicking "Join OttoWrite AI Now", you agree to our{' '}
                    <a href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>

                {/* Social Proof */}
                <div className="border-t pt-6">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Rated 4.9/5 by over 10,000 writers
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>25,000+ users</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>No credit card required</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}