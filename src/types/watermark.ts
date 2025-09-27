// Watermark System Types
export interface WatermarkConfig {
  id: string;
  name: string;
  text: string;
  subText?: string;
  position: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left';
  style: {
    fontSize: number;
    color: string;
    opacity: number;
    fontFamily: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    padding: number;
    borderRadius: number;
  };
  forUserTiers: ('free' | 'premium' | 'enterprise')[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatermarkSettings {
  enabled: boolean;
  showOnExport: boolean;
  showOnPrint: boolean;
  showOnWebView: boolean;
  customMessage?: string;
  branding: {
    includeLogo: boolean;
    includeWebsite: boolean;
    includeUpgradePrompt: boolean;
  };
}

export interface DocumentWatermark {
  id: string;
  documentId: string;
  userId: string;
  userTier: 'free' | 'premium' | 'enterprise';
  watermarkConfig: WatermarkConfig;
  appliedAt: Date;
  format: 'pdf' | 'docx' | 'html' | 'print';
}

// Predefined watermark templates
export const WATERMARK_TEMPLATES: Omit<WatermarkConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Default Free User',
    text: 'Created with OttoWrite AI',
    subText: 'Upgrade for watermark-free exports',
    position: 'bottom-right',
    style: {
      fontSize: 10,
      color: '#6B7280',
      opacity: 0.8,
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#F9FAFB',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: 8,
      borderRadius: 4
    },
    forUserTiers: ['free'],
    isActive: true
  },
  {
    name: 'Subtle Branding',
    text: 'OttoWrite.ai',
    position: 'bottom-right',
    style: {
      fontSize: 8,
      color: '#9CA3AF',
      opacity: 0.6,
      fontFamily: 'Inter, sans-serif',
      padding: 4,
      borderRadius: 2
    },
    forUserTiers: ['free'],
    isActive: false
  },
  {
    name: 'Upgrade Prompt',
    text: 'Upgrade to Premium',
    subText: 'Remove watermarks & unlock AI features',
    position: 'bottom-center',
    style: {
      fontSize: 11,
      color: '#3B82F6',
      opacity: 0.9,
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#EFF6FF',
      borderColor: '#DBEAFE',
      borderWidth: 1,
      padding: 10,
      borderRadius: 6
    },
    forUserTiers: ['free'],
    isActive: false
  }
];

export interface WatermarkPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}