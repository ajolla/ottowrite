import { ABTestingEngine } from './ab-testing-engine';
import { ABExperiment, ABVariant } from '@/types/ab-testing';

// Platform-wide A/B Testing Manager
export class PlatformABTesting {
  private static instance: PlatformABTesting;
  private experiments: Map<string, ABExperiment> = new Map();
  private userVariants: Map<string, Map<string, ABVariant>> = new Map(); // userId -> experimentId -> variant

  static getInstance(): PlatformABTesting {
    if (!PlatformABTesting.instance) {
      PlatformABTesting.instance = new PlatformABTesting();
    }
    return PlatformABTesting.instance;
  }

  // Initialize A/B testing for a user session
  async initializeUserSession(userId: string): Promise<void> {
    if (!this.userVariants.has(userId)) {
      this.userVariants.set(userId, new Map());
    }

    // Load active experiments
    await this.loadActiveExperiments();

    // Assign user to experiments
    for (const [experimentId, experiment] of this.experiments) {
      if (experiment.status === 'running') {
        const variant = await ABTestingEngine.getUserVariant(userId, experimentId);
        if (variant) {
          this.userVariants.get(userId)!.set(experimentId, variant);
        }
      }
    }
  }

  // Get feature configuration with A/B test overrides
  async getFeatureConfig(userId: string, feature: string, defaultConfig: any): Promise<any> {
    const userExperiments = this.userVariants.get(userId);
    if (!userExperiments) {
      return defaultConfig;
    }

    // Find active experiment for this feature
    for (const [experimentId, variant] of userExperiments) {
      const experiment = this.experiments.get(experimentId);
      if (experiment && experiment.feature === feature) {
        return this.mergeConfigs(defaultConfig, variant.config);
      }
    }

    return defaultConfig;
  }

  // Feature flag with A/B testing
  async isFeatureEnabled(userId: string, featureFlag: string, defaultValue: boolean = false): Promise<boolean> {
    const config = await this.getFeatureConfig(userId, featureFlag, { enabled: defaultValue });
    return config.enabled ?? defaultValue;
  }

  // Track any platform event for A/B testing
  async trackEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, any> = {},
    conversionValue: number = 0
  ): Promise<void> {
    const userExperiments = this.userVariants.get(userId);
    if (!userExperiments) return;

    // Track event for all active experiments
    for (const [experimentId] of userExperiments) {
      await ABTestingEngine.trackConversion(userId, experimentId, eventType, eventData, conversionValue);
    }
  }

  // Get variant for specific experiment
  getUserVariantForExperiment(userId: string, experimentId: string): ABVariant | null {
    return this.userVariants.get(userId)?.get(experimentId) || null;
  }

  // Load active experiments from database
  private async loadActiveExperiments(): Promise<void> {
    // This would load from your database
    // For now, we'll use the predefined templates
    const { EXPERIMENT_TEMPLATES } = await import('@/types/ab-testing');

    EXPERIMENT_TEMPLATES.forEach((template, index) => {
      const experiment: ABExperiment = {
        ...template,
        id: `exp_${index}`,
        status: 'running',
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.experiments.set(experiment.id, experiment);
    });
  }

  // Merge default config with A/B test variant config
  private mergeConfigs(defaultConfig: any, variantConfig: any): any {
    return {
      ...defaultConfig,
      ...variantConfig
    };
  }
}

// React Hook for A/B Testing
export function useABTesting(userId: string | null) {
  const abTesting = PlatformABTesting.getInstance();

  const getFeatureConfig = async (feature: string, defaultConfig: any) => {
    if (!userId) return defaultConfig;
    return await abTesting.getFeatureConfig(userId, feature, defaultConfig);
  };

  const isFeatureEnabled = async (featureFlag: string, defaultValue: boolean = false) => {
    if (!userId) return defaultValue;
    return await abTesting.isFeatureEnabled(userId, featureFlag, defaultValue);
  };

  const trackEvent = async (eventType: string, eventData: Record<string, any> = {}, conversionValue: number = 0) => {
    if (!userId) return;
    await abTesting.trackEvent(userId, eventType, eventData, conversionValue);
  };

  const getUserVariant = (experimentId: string) => {
    if (!userId) return null;
    return abTesting.getUserVariantForExperiment(userId, experimentId);
  };

  const initializeSession = async () => {
    if (!userId) return;
    await abTesting.initializeUserSession(userId);
  };

  return {
    getFeatureConfig,
    isFeatureEnabled,
    trackEvent,
    getUserVariant,
    initializeSession
  };
}

// Platform Feature Configurations
export const PLATFORM_FEATURES = {
  // UI/UX Features
  NAVBAR_DESIGN: 'navbar_design',
  SIDEBAR_LAYOUT: 'sidebar_layout',
  THEME_COLORS: 'theme_colors',
  BUTTON_STYLES: 'button_styles',
  EDITOR_LAYOUT: 'editor_layout',

  // Pricing Features
  PRICING_DISPLAY: 'pricing_display',
  FREE_TRIAL_LENGTH: 'free_trial_length',
  UPGRADE_PROMPTS: 'upgrade_prompts',
  PAYMENT_FLOW: 'payment_flow',

  // AI Features
  AI_SUGGESTIONS: 'ai_suggestions',
  AI_WRITING_TOOLS: 'ai_writing_tools',
  AI_ANALYSIS: 'ai_analysis',
  AI_PROMPTS: 'ai_prompts',

  // Onboarding Features
  SIGNUP_FLOW: 'signup_flow',
  TUTORIAL_STEPS: 'tutorial_steps',
  WELCOME_EXPERIENCE: 'welcome_experience',

  // Content Features
  WATERMARKS: 'watermarks',
  EXPORT_OPTIONS: 'export_options',
  COLLABORATION: 'collaboration',
  TEMPLATES: 'templates',

  // Engagement Features
  NOTIFICATIONS: 'notifications',
  GAMIFICATION: 'gamification',
  SOCIAL_FEATURES: 'social_features',
  ACHIEVEMENT_SYSTEM: 'achievement_system'
} as const;

// Predefined A/B Test Scenarios for Platform
export const PLATFORM_AB_TESTS = {
  // UI/UX Tests
  NAVBAR_STYLE: {
    name: 'Navbar Design Test',
    description: 'Test modern vs. classic navbar design',
    feature: PLATFORM_FEATURES.NAVBAR_DESIGN,
    variants: [
      {
        name: 'Classic Navbar',
        config: {
          style: 'classic',
          logo: 'text',
          menuStyle: 'horizontal',
          searchPosition: 'right'
        }
      },
      {
        name: 'Modern Navbar',
        config: {
          style: 'modern',
          logo: 'icon',
          menuStyle: 'compact',
          searchPosition: 'center'
        }
      }
    ]
  },

  // Pricing Tests
  PRICING_STRATEGY: {
    name: 'Pricing Strategy Test',
    description: 'Test different pricing displays and strategies',
    feature: PLATFORM_FEATURES.PRICING_DISPLAY,
    variants: [
      {
        name: 'Monthly Pricing',
        config: {
          primaryDisplay: 'monthly',
          showAnnualDiscount: true,
          highlightedPlan: 'premium',
          showFeatureComparison: true
        }
      },
      {
        name: 'Annual Pricing',
        config: {
          primaryDisplay: 'annual',
          showMonthlyEquivalent: true,
          highlightedPlan: 'premium',
          showSavings: true
        }
      }
    ]
  },

  // AI Feature Tests
  AI_WRITING_ASSISTANT: {
    name: 'AI Writing Assistant Test',
    description: 'Test different AI suggestion interfaces',
    feature: PLATFORM_FEATURES.AI_SUGGESTIONS,
    variants: [
      {
        name: 'Sidebar Assistant',
        config: {
          placement: 'sidebar',
          triggerMode: 'automatic',
          suggestionCount: 3,
          showConfidence: true
        }
      },
      {
        name: 'Inline Assistant',
        config: {
          placement: 'inline',
          triggerMode: 'manual',
          suggestionCount: 5,
          showAlternatives: true
        }
      }
    ]
  },

  // Onboarding Tests
  SIGNUP_EXPERIENCE: {
    name: 'Signup Flow Test',
    description: 'Test different signup processes',
    feature: PLATFORM_FEATURES.SIGNUP_FLOW,
    variants: [
      {
        name: 'Simple Signup',
        config: {
          steps: ['email', 'password'],
          requireEmailVerification: false,
          showSocialSignup: true,
          welcomeFlow: 'skip'
        }
      },
      {
        name: 'Detailed Signup',
        config: {
          steps: ['email', 'password', 'profile', 'preferences'],
          requireEmailVerification: true,
          showSocialSignup: false,
          welcomeFlow: 'guided'
        }
      }
    ]
  },

  // Content Feature Tests
  WATERMARK_STRATEGY: {
    name: 'Watermark Strategy Test',
    description: 'Test different watermark approaches',
    feature: PLATFORM_FEATURES.WATERMARKS,
    variants: [
      {
        name: 'Subtle Watermark',
        config: {
          watermark: {
            enabled: true,
            style: 'subtle',
            message: 'Created with OttoWrite',
            position: 'bottom-right',
            opacity: 0.6
          }
        }
      },
      {
        name: 'Prominent Watermark',
        config: {
          watermark: {
            enabled: true,
            style: 'prominent',
            message: 'Upgrade to Premium - Remove Watermarks',
            position: 'bottom-center',
            opacity: 0.9
          }
        }
      }
    ]
  },

  // Engagement Tests
  GAMIFICATION: {
    name: 'Gamification Test',
    description: 'Test gamification elements',
    feature: PLATFORM_FEATURES.GAMIFICATION,
    variants: [
      {
        name: 'No Gamification',
        config: {
          enabled: false
        }
      },
      {
        name: 'Achievement System',
        config: {
          enabled: true,
          showProgress: true,
          showBadges: true,
          showLeaderboard: false,
          achievements: ['first_document', 'power_user', 'premium_upgrade']
        }
      },
      {
        name: 'Full Gamification',
        config: {
          enabled: true,
          showProgress: true,
          showBadges: true,
          showLeaderboard: true,
          showStreaks: true,
          showPoints: true,
          achievements: ['first_document', 'power_user', 'premium_upgrade', 'collaboration_master']
        }
      }
    ]
  }
};

// Conversion Goals for Different Features
export const CONVERSION_GOALS = {
  // Revenue conversions
  UPGRADE_TO_PREMIUM: 'upgrade_to_premium',
  UPGRADE_TO_ENTERPRISE: 'upgrade_to_enterprise',
  SUBSCRIPTION_RENEWAL: 'subscription_renewal',

  // Engagement conversions
  DOCUMENT_CREATED: 'document_created',
  DOCUMENT_EXPORTED: 'document_exported',
  AI_FEATURE_USED: 'ai_feature_used',
  COLLABORATION_STARTED: 'collaboration_started',

  // Retention conversions
  DAILY_ACTIVE_USER: 'daily_active_user',
  WEEKLY_RETURN: 'weekly_return',
  FEATURE_ADOPTION: 'feature_adoption',

  // Product conversions
  TEMPLATE_USED: 'template_used',
  TUTORIAL_COMPLETED: 'tutorial_completed',
  REFERRAL_SENT: 'referral_sent',
  SUPPORT_CONTACTED: 'support_contacted'
};

// Event Tracking Helper
export class PlatformEventTracker {
  static async trackUserAction(
    userId: string,
    action: string,
    feature: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const abTesting = PlatformABTesting.getInstance();

    await abTesting.trackEvent(userId, action, {
      feature,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Also track in your regular analytics
    // e.g., Google Analytics, Mixpanel, etc.
    console.log(`[A/B Test Event] User ${userId} performed ${action} on ${feature}`, metadata);
  }

  // Common platform events
  static trackSignup = (userId: string, method: string) =>
    this.trackUserAction(userId, CONVERSION_GOALS.DOCUMENT_CREATED, PLATFORM_FEATURES.SIGNUP_FLOW, { method });

  static trackDocumentCreated = (userId: string, documentType: string) =>
    this.trackUserAction(userId, CONVERSION_GOALS.DOCUMENT_CREATED, PLATFORM_FEATURES.EDITOR_LAYOUT, { documentType });

  static trackAIFeatureUsed = (userId: string, featureType: string) =>
    this.trackUserAction(userId, CONVERSION_GOALS.AI_FEATURE_USED, PLATFORM_FEATURES.AI_SUGGESTIONS, { featureType });

  static trackUpgrade = (userId: string, fromTier: string, toTier: string) =>
    this.trackUserAction(userId, CONVERSION_GOALS.UPGRADE_TO_PREMIUM, PLATFORM_FEATURES.PRICING_DISPLAY, { fromTier, toTier });

  static trackExport = (userId: string, format: string, hasWatermark: boolean) =>
    this.trackUserAction(userId, CONVERSION_GOALS.DOCUMENT_EXPORTED, PLATFORM_FEATURES.EXPORT_OPTIONS, { format, hasWatermark });
}