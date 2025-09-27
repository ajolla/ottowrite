// A/B Testing System Types
export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  feature: 'watermark' | 'pricing' | 'onboarding' | 'ui' | 'messaging' | 'ai_assistant' | 'editor' | 'collaboration' | 'export' | 'themes' | 'analytics' | 'notifications' | 'search' | 'templates' | 'publishing';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

  // Experiment configuration
  trafficAllocation: number; // Percentage of users to include (0-100)
  variants: ABVariant[];
  targetAudience: {
    userTiers: ('free' | 'premium' | 'enterprise')[];
    newUsersOnly?: boolean;
    countries?: string[];
    minAccountAge?: number; // days
    excludeUserIds?: string[];
  };

  // Timing
  startDate: Date;
  endDate?: Date;
  duration?: number; // days

  // Goals and metrics
  primaryMetric: string;
  secondaryMetrics: string[];
  conversionGoal: 'upgrade_to_premium' | 'document_export' | 'feature_usage' | 'retention';
  minimumSampleSize: number;
  minimumEffect: number; // Minimum detectable effect (%)
  confidenceLevel: number; // 95, 99, etc.

  // Results
  results?: ABExperimentResults;

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  trafficSplit: number; // Percentage of experiment traffic (variants should sum to 100)
  config: ABVariantConfig;
}

export interface ABVariantConfig {
  // Watermark-specific config
  watermark?: {
    enabled: boolean;
    configId?: string;
    customConfig?: {
      text: string;
      subText?: string;
      position: string;
      style: any;
    };
  };

  // Pricing-specific config
  pricing?: {
    premiumPrice: number;
    enterprisePrice: number;
    discountPercentage?: number;
    features: string[];
  };

  // UI-specific config
  ui?: {
    theme: string;
    primaryColor: string;
    buttonStyle: string;
    layout: string;
  };

  // Messaging config
  messaging?: {
    upgradePrompts: string[];
    features: string[];
    ctaText: string;
  };

  // AI Assistant config
  ai_assistant?: {
    model: 'gpt-4' | 'claude-3' | 'custom';
    features: string[];
    responseStyle: 'helpful' | 'creative' | 'professional';
    maxSuggestions: number;
  };

  // Editor config
  editor?: {
    layout: 'standard' | 'distraction-free' | 'split';
    toolbarPosition: 'top' | 'bottom' | 'floating';
    autoSave: boolean;
    spellCheck: boolean;
  };

  // Collaboration config
  collaboration?: {
    realTimeEditing: boolean;
    commentSystem: 'inline' | 'sidebar' | 'overlay';
    sharePermissions: string[];
  };

  // Export config
  export?: {
    formats: string[];
    quality: 'standard' | 'high' | 'print';
    branding: boolean;
  };

  // Theme config
  themes?: {
    defaultTheme: string;
    allowCustomization: boolean;
    colorSchemes: string[];
  };

  // Analytics config
  analytics?: {
    trackingLevel: 'basic' | 'detailed' | 'none';
    reportFrequency: 'daily' | 'weekly' | 'monthly';
    metrics: string[];
  };
}

export interface ABExperimentResults {
  status: 'insufficient_data' | 'no_significant_difference' | 'significant_winner' | 'significant_loser';
  winningVariant?: string;
  confidence: number;
  pValue: number;
  effect: number; // Percentage improvement

  variantResults: ABVariantResults[];

  // Time-based results
  dailyResults: ABDailyResults[];

  calculatedAt: Date;
}

export interface ABVariantResults {
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  confidence: [number, number]; // Confidence interval

  // Secondary metrics
  secondaryMetrics: Record<string, {
    value: number;
    improvement?: number;
  }>;
}

export interface ABDailyResults {
  date: Date;
  variantResults: {
    variantId: string;
    participants: number;
    conversions: number;
    conversionRate: number;
  }[];
}

export interface ABUserAssignment {
  id: string;
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
  firstSeen: Date;
  lastSeen: Date;
  converted: boolean;
  convertedAt?: Date;
  conversionValue?: number;

  // Context when assigned
  userTier: string;
  userAgent: string;
  country?: string;
  referralSource?: string;
}

export interface ABConversionEvent {
  id: string;
  userId: string;
  experimentId: string;
  variantId: string;
  eventType: string;
  eventData: Record<string, any>;
  conversionValue?: number;
  occurredAt: Date;
}

// A/B Testing Configuration
export interface ABTestingConfig {
  enabled: boolean;
  defaultTrafficAllocation: number;
  cookieDuration: number; // days
  statisticalSignificance: number; // 0.95 for 95%
  minimumSampleSize: number;
  maximumExperimentDuration: number; // days
}

// Statistical analysis types
export interface StatisticalTest {
  testType: 'chi_square' | 't_test' | 'mann_whitney';
  pValue: number;
  confidence: number;
  significant: boolean;
  effect: number;
  powerAnalysis: {
    power: number;
    sampleSizeNeeded: number;
    actualSampleSize: number;
  };
}

// Pre-defined experiment templates
export const EXPERIMENT_TEMPLATES: Omit<ABExperiment, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Watermark Message A/B Test',
    description: 'Test different watermark messages to optimize conversion rates',
    hypothesis: 'More compelling watermark messaging will increase premium upgrades',
    feature: 'watermark',
    status: 'draft',
    trafficAllocation: 50,
    variants: [
      {
        id: 'control',
        name: 'Current Watermark',
        description: 'Existing watermark configuration',
        isControl: true,
        trafficSplit: 50,
        config: {
          watermark: {
            enabled: true,
            configId: 'default'
          }
        }
      },
      {
        id: 'variant_a',
        name: 'Urgency Message',
        description: 'Watermark with urgency messaging',
        isControl: false,
        trafficSplit: 50,
        config: {
          watermark: {
            enabled: true,
            customConfig: {
              text: 'Limited Time: Upgrade Now',
              subText: 'Remove watermarks + unlock AI features',
              position: 'bottom-right',
              style: {
                fontSize: 11,
                color: '#DC2626',
                opacity: 0.9,
                fontFamily: 'Inter, sans-serif',
                backgroundColor: '#FEF2F2',
                borderColor: '#FECACA',
                borderWidth: 1,
                padding: 10,
                borderRadius: 6
              }
            }
          }
        }
      }
    ],
    targetAudience: {
      userTiers: ['free'],
      newUsersOnly: false
    },
    startDate: new Date(),
    duration: 14,
    primaryMetric: 'conversion_rate',
    secondaryMetrics: ['document_exports', 'time_to_conversion', 'user_engagement'],
    conversionGoal: 'upgrade_to_premium',
    minimumSampleSize: 1000,
    minimumEffect: 10,
    confidenceLevel: 95
  },
  {
    name: 'Watermark Position Test',
    description: 'Test different watermark positions for optimal visibility and conversion',
    hypothesis: 'Bottom-center watermarks will be more noticeable and drive more conversions',
    feature: 'watermark',
    status: 'draft',
    trafficAllocation: 30,
    variants: [
      {
        id: 'bottom_right',
        name: 'Bottom Right (Control)',
        description: 'Current bottom-right positioning',
        isControl: true,
        trafficSplit: 50,
        config: {
          watermark: {
            enabled: true,
            customConfig: {
              text: 'Created with OttoWrite AI',
              subText: 'Upgrade for watermark-free exports',
              position: 'bottom-right',
              style: {}
            }
          }
        }
      },
      {
        id: 'bottom_center',
        name: 'Bottom Center',
        description: 'More prominent bottom-center positioning',
        isControl: false,
        trafficSplit: 50,
        config: {
          watermark: {
            enabled: true,
            customConfig: {
              text: 'Created with OttoWrite AI',
              subText: 'Upgrade for watermark-free exports',
              position: 'bottom-center',
              style: {}
            }
          }
        }
      }
    ],
    targetAudience: {
      userTiers: ['free']
    },
    startDate: new Date(),
    duration: 21,
    primaryMetric: 'conversion_rate',
    secondaryMetrics: ['watermark_visibility', 'user_satisfaction'],
    conversionGoal: 'upgrade_to_premium',
    minimumSampleSize: 2000,
    minimumEffect: 15,
    confidenceLevel: 95
  }
];