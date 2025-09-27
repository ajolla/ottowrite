'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlatformABTesting, PlatformEventTracker, PLATFORM_FEATURES, CONVERSION_GOALS } from '@/lib/platform-ab-testing';
import { ABVariant } from '@/types/ab-testing';

interface UseABTestingReturn {
  isLoading: boolean;
  getFeatureConfig: <T>(feature: string, defaultConfig: T) => Promise<T>;
  isFeatureEnabled: (featureFlag: string, defaultValue?: boolean) => Promise<boolean>;
  trackEvent: (eventType: string, eventData?: Record<string, any>, conversionValue?: number) => Promise<void>;
  getUserVariant: (experimentId: string) => ABVariant | null;
  getUIConfig: (component: string, defaultConfig: any) => Promise<any>;
  trackConversion: (goal: string, metadata?: Record<string, any>) => Promise<void>;
  trackUserAction: (action: string, feature: string, metadata?: Record<string, any>) => Promise<void>;
}

export function useABTesting(userId: string | null): UseABTestingReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [abTesting] = useState(() => PlatformABTesting.getInstance());

  useEffect(() => {
    const initializeSession = async () => {
      if (userId) {
        try {
          await abTesting.initializeUserSession(userId);
        } catch (error) {
          console.error('Failed to initialize A/B testing session:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [userId, abTesting]);

  const getFeatureConfig = useCallback(async <T,>(feature: string, defaultConfig: T): Promise<T> => {
    if (!userId) return defaultConfig;
    try {
      return await abTesting.getFeatureConfig(userId, feature, defaultConfig);
    } catch (error) {
      console.error(`Failed to get feature config for ${feature}:`, error);
      return defaultConfig;
    }
  }, [userId, abTesting]);

  const isFeatureEnabled = useCallback(async (featureFlag: string, defaultValue: boolean = false): Promise<boolean> => {
    if (!userId) return defaultValue;
    try {
      return await abTesting.isFeatureEnabled(userId, featureFlag, defaultValue);
    } catch (error) {
      console.error(`Failed to check feature flag ${featureFlag}:`, error);
      return defaultValue;
    }
  }, [userId, abTesting]);

  const trackEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, any> = {},
    conversionValue: number = 0
  ): Promise<void> => {
    if (!userId) return;
    try {
      await abTesting.trackEvent(userId, eventType, eventData, conversionValue);
    } catch (error) {
      console.error(`Failed to track event ${eventType}:`, error);
    }
  }, [userId, abTesting]);

  const getUserVariant = useCallback((experimentId: string): ABVariant | null => {
    if (!userId) return null;
    return abTesting.getUserVariantForExperiment(userId, experimentId);
  }, [userId, abTesting]);

  // Specialized methods for common platform use cases
  const getUIConfig = useCallback(async (component: string, defaultConfig: any): Promise<any> => {
    const featureKey = `ui_${component}`;
    return await getFeatureConfig(featureKey, defaultConfig);
  }, [getFeatureConfig]);

  const trackConversion = useCallback(async (goal: string, metadata: Record<string, any> = {}): Promise<void> => {
    await trackEvent(goal, {
      conversionGoal: true,
      timestamp: new Date().toISOString(),
      ...metadata
    }, 1);
  }, [trackEvent]);

  const trackUserAction = useCallback(async (
    action: string,
    feature: string,
    metadata: Record<string, any> = {}
  ): Promise<void> => {
    if (!userId) return;
    await PlatformEventTracker.trackUserAction(userId, action, feature, metadata);
  }, [userId]);

  return {
    isLoading,
    getFeatureConfig,
    isFeatureEnabled,
    trackEvent,
    getUserVariant,
    getUIConfig,
    trackConversion,
    trackUserAction
  };
}

// Specialized hooks for specific features
export function useWatermarkABTest(userId: string | null) {
  const { getFeatureConfig, trackConversion } = useABTesting(userId);

  const getWatermarkConfig = useCallback(async (defaultConfig: any) => {
    return await getFeatureConfig(PLATFORM_FEATURES.WATERMARKS, defaultConfig);
  }, [getFeatureConfig]);

  const trackWatermarkConversion = useCallback(async () => {
    await trackConversion(CONVERSION_GOALS.UPGRADE_TO_PREMIUM, {
      trigger: 'watermark_click',
      feature: PLATFORM_FEATURES.WATERMARKS
    });
  }, [trackConversion]);

  return {
    getWatermarkConfig,
    trackWatermarkConversion
  };
}

export function usePricingABTest(userId: string | null) {
  const { getFeatureConfig, trackConversion } = useABTesting(userId);

  const getPricingConfig = useCallback(async (defaultConfig: any) => {
    return await getFeatureConfig(PLATFORM_FEATURES.PRICING_DISPLAY, defaultConfig);
  }, [getFeatureConfig]);

  const trackPricingConversion = useCallback(async (plan: string) => {
    await trackConversion(CONVERSION_GOALS.UPGRADE_TO_PREMIUM, {
      selectedPlan: plan,
      feature: PLATFORM_FEATURES.PRICING_DISPLAY
    });
  }, [trackConversion]);

  return {
    getPricingConfig,
    trackPricingConversion
  };
}

export function useAIAssistantABTest(userId: string | null) {
  const { getFeatureConfig, trackUserAction } = useABTesting(userId);

  const getAIConfig = useCallback(async (defaultConfig: any) => {
    return await getFeatureConfig(PLATFORM_FEATURES.AI_SUGGESTIONS, defaultConfig);
  }, [getFeatureConfig]);

  const trackAIUsage = useCallback(async (featureType: string) => {
    await trackUserAction(
      CONVERSION_GOALS.AI_FEATURE_USED,
      PLATFORM_FEATURES.AI_SUGGESTIONS,
      { featureType }
    );
  }, [trackUserAction]);

  return {
    getAIConfig,
    trackAIUsage
  };
}

export function useOnboardingABTest(userId: string | null) {
  const { getFeatureConfig, trackConversion } = useABTesting(userId);

  const getOnboardingConfig = useCallback(async (defaultConfig: any) => {
    return await getFeatureConfig(PLATFORM_FEATURES.SIGNUP_FLOW, defaultConfig);
  }, [getFeatureConfig]);

  const trackOnboardingCompletion = useCallback(async (step: string) => {
    await trackConversion(CONVERSION_GOALS.TUTORIAL_COMPLETED, {
      completedStep: step,
      feature: PLATFORM_FEATURES.SIGNUP_FLOW
    });
  }, [trackConversion]);

  return {
    getOnboardingConfig,
    trackOnboardingCompletion
  };
}

// Higher-order component for A/B testing
export function withABTesting<P extends object>(
  Component: React.ComponentType<P>,
  feature: string,
  defaultConfig: any = {}
) {
  return function ABTestWrapper(props: P & { userId?: string }) {
    const { userId, ...componentProps } = props;
    const { getFeatureConfig, isLoading } = useABTesting(userId || null);
    const [config, setConfig] = useState(defaultConfig);

    useEffect(() => {
      const loadConfig = async () => {
        const featureConfig = await getFeatureConfig(feature, defaultConfig);
        setConfig(featureConfig);
      };

      if (!isLoading) {
        loadConfig();
      }
    }, [getFeatureConfig, isLoading, feature]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return <Component {...(componentProps as P)} abTestConfig={config} />;
  };
}

// Utility functions for common A/B testing patterns
export const ABTestingUtils = {
  // Get experiment variant class name for CSS
  getVariantClassName: (userId: string | null, experimentId: string, prefix: string = 'variant') => {
    const abTesting = PlatformABTesting.getInstance();
    const variant = userId ? abTesting.getUserVariantForExperiment(userId, experimentId) : null;
    return variant ? `${prefix}-${variant.id}` : `${prefix}-default`;
  },

  // Check if user is in experiment
  isUserInExperiment: (userId: string | null, experimentId: string): boolean => {
    if (!userId) return false;
    const abTesting = PlatformABTesting.getInstance();
    return abTesting.getUserVariantForExperiment(userId, experimentId) !== null;
  },

  // Get experiment metrics for admin dashboard
  getExperimentMetrics: async (experimentId: string) => {
    // This would fetch real metrics from your analytics backend
    return {
      participants: 1500,
      conversions: 123,
      conversionRate: 8.2,
      confidence: 95,
      status: 'running'
    };
  }
};