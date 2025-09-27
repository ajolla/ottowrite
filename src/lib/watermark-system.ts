import { WatermarkConfig, WatermarkSettings, DocumentWatermark, WatermarkPosition, WATERMARK_TEMPLATES } from '@/types/watermark';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class WatermarkSystemManager {
  // Get watermark configuration for user tier
  static async getWatermarkForUser(userTier: 'free' | 'premium' | 'enterprise'): Promise<WatermarkConfig | null> {
    try {
      // Premium and enterprise users don't get watermarks
      if (userTier === 'premium' || userTier === 'enterprise') {
        return null;
      }

      // Get active watermark for free users
      const { data: watermarks, error } = await supabase
        .from('watermark_configs')
        .select('*')
        .contains('for_user_tiers', [userTier])
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (watermarks && watermarks.length > 0) {
        return this.transformWatermarkFromDb(watermarks[0]);
      }

      // Fallback to default template
      return {
        ...WATERMARK_TEMPLATES[0],
        id: 'default',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting watermark for user:', error);
      return null;
    }
  }

  // Apply watermark to document content
  static applyWatermarkToHTML(content: string, watermarkConfig: WatermarkConfig): string {
    if (!watermarkConfig) return content;

    const watermarkHTML = this.generateWatermarkHTML(watermarkConfig);

    // Insert watermark before closing body tag
    const bodyCloseIndex = content.lastIndexOf('</body>');
    if (bodyCloseIndex !== -1) {
      return content.slice(0, bodyCloseIndex) + watermarkHTML + content.slice(bodyCloseIndex);
    }

    // If no body tag, append to end
    return content + watermarkHTML;
  }

  // Generate HTML watermark element
  static generateWatermarkHTML(watermarkConfig: WatermarkConfig): string {
    const { text, subText, position, style } = watermarkConfig;

    const positionStyles = this.getPositionStyles(position);
    const styleCSS = this.generateWatermarkCSS(style);

    return `
      <div class="ottowrite-watermark" style="${positionStyles}${styleCSS}">
        <div class="watermark-main-text">${text}</div>
        ${subText ? `<div class="watermark-sub-text" style="font-size: ${style.fontSize - 2}px; opacity: 0.7; margin-top: 2px;">${subText}</div>` : ''}
      </div>
      <style>
        .ottowrite-watermark {
          pointer-events: none;
          user-select: none;
          z-index: 1000;
          font-family: ${style.fontFamily};
          line-height: 1.2;
          white-space: nowrap;
        }
        @media print {
          .ottowrite-watermark {
            display: block !important;
            position: fixed !important;
          }
        }
        @page {
          margin-bottom: 60px;
        }
      </style>
    `;
  }

  // Generate PDF watermark (for server-side PDF generation)
  static generatePDFWatermark(watermarkConfig: WatermarkConfig, pageWidth: number, pageHeight: number): WatermarkPosition & { content: string; style: any } {
    const { text, subText, position, style } = watermarkConfig;

    // Calculate position based on page dimensions
    let x: number, y: number;
    const watermarkWidth = text.length * style.fontSize * 0.6; // Approximate width
    const watermarkHeight = style.fontSize * (subText ? 2.5 : 1.5);

    switch (position) {
      case 'bottom-right':
        x = pageWidth - watermarkWidth - 20;
        y = pageHeight - watermarkHeight - 20;
        break;
      case 'bottom-left':
        x = 20;
        y = pageHeight - watermarkHeight - 20;
        break;
      case 'bottom-center':
        x = (pageWidth - watermarkWidth) / 2;
        y = pageHeight - watermarkHeight - 20;
        break;
      case 'top-right':
        x = pageWidth - watermarkWidth - 20;
        y = 20;
        break;
      case 'top-left':
        x = 20;
        y = 20;
        break;
      default:
        x = pageWidth - watermarkWidth - 20;
        y = pageHeight - watermarkHeight - 20;
    }

    return {
      x,
      y,
      width: watermarkWidth,
      height: watermarkHeight,
      content: subText ? `${text}\n${subText}` : text,
      style: {
        fontSize: style.fontSize,
        color: style.color,
        fontFamily: style.fontFamily,
        opacity: style.opacity,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        padding: style.padding,
        borderRadius: style.borderRadius
      }
    };
  }

  // Create watermark-protected CSS for print
  static generatePrintProtectionCSS(): string {
    return `
      <style>
        @media print {
          body::after {
            content: "Created with OttoWrite AI - Upgrade for watermark-free exports";
            position: fixed;
            bottom: 20px;
            right: 20px;
            font-size: 10px;
            color: #666;
            opacity: 0.8;
            font-family: Arial, sans-serif;
            background: rgba(255,255,255,0.9);
            padding: 5px 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            z-index: 9999;
          }

          /* Prevent content modification */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }

        /* Prevent easy removal of watermark */
        .ottowrite-watermark {
          position: fixed !important;
          bottom: 20px !important;
          right: 20px !important;
          z-index: 9999 !important;
          pointer-events: none !important;
          user-select: none !important;
        }
      </style>
    `;
  }

  // Track watermark application
  static async trackWatermarkApplication(
    documentId: string,
    userId: string,
    userTier: 'free' | 'premium' | 'enterprise',
    watermarkConfig: WatermarkConfig,
    format: 'pdf' | 'docx' | 'html' | 'print'
  ): Promise<void> {
    try {
      await supabase
        .from('document_watermarks')
        .insert({
          document_id: documentId,
          user_id: userId,
          user_tier: userTier,
          watermark_config: watermarkConfig,
          applied_at: new Date().toISOString(),
          format
        });
    } catch (error) {
      console.error('Error tracking watermark application:', error);
      // Don't throw - watermark tracking shouldn't break document generation
    }
  }

  // Admin: Create custom watermark configuration
  static async createWatermarkConfig(config: Omit<WatermarkConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<WatermarkConfig> {
    try {
      const { data: watermark, error } = await supabase
        .from('watermark_configs')
        .insert({
          name: config.name,
          text: config.text,
          sub_text: config.subText,
          position: config.position,
          style: config.style,
          for_user_tiers: config.forUserTiers,
          is_active: config.isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return this.transformWatermarkFromDb(watermark);
    } catch (error) {
      console.error('Error creating watermark config:', error);
      throw error;
    }
  }

  // Admin: Get all watermark configurations
  static async getAllWatermarkConfigs(): Promise<WatermarkConfig[]> {
    try {
      const { data: watermarks, error } = await supabase
        .from('watermark_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return watermarks?.map(this.transformWatermarkFromDb) || [];
    } catch (error) {
      console.error('Error getting watermark configs:', error);
      return [];
    }
  }

  // Admin: Update watermark configuration
  static async updateWatermarkConfig(id: string, updates: Partial<WatermarkConfig>): Promise<void> {
    try {
      const { error } = await supabase
        .from('watermark_configs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating watermark config:', error);
      throw error;
    }
  }

  // Helper methods
  private static getPositionStyles(position: string): string {
    const baseStyles = 'position: fixed; ';

    switch (position) {
      case 'bottom-right':
        return baseStyles + 'bottom: 20px; right: 20px; ';
      case 'bottom-left':
        return baseStyles + 'bottom: 20px; left: 20px; ';
      case 'bottom-center':
        return baseStyles + 'bottom: 20px; left: 50%; transform: translateX(-50%); ';
      case 'top-right':
        return baseStyles + 'top: 20px; right: 20px; ';
      case 'top-left':
        return baseStyles + 'top: 20px; left: 20px; ';
      default:
        return baseStyles + 'bottom: 20px; right: 20px; ';
    }
  }

  private static generateWatermarkCSS(style: any): string {
    let css = '';
    css += `font-size: ${style.fontSize}px; `;
    css += `color: ${style.color}; `;
    css += `opacity: ${style.opacity}; `;
    css += `font-family: ${style.fontFamily}; `;
    css += `padding: ${style.padding}px; `;
    css += `border-radius: ${style.borderRadius}px; `;

    if (style.backgroundColor) {
      css += `background-color: ${style.backgroundColor}; `;
    }

    if (style.borderColor && style.borderWidth) {
      css += `border: ${style.borderWidth}px solid ${style.borderColor}; `;
    }

    return css;
  }

  private static transformWatermarkFromDb(dbWatermark: any): WatermarkConfig {
    return {
      id: dbWatermark.id,
      name: dbWatermark.name,
      text: dbWatermark.text,
      subText: dbWatermark.sub_text,
      position: dbWatermark.position,
      style: dbWatermark.style,
      forUserTiers: dbWatermark.for_user_tiers,
      isActive: dbWatermark.is_active,
      createdAt: new Date(dbWatermark.created_at),
      updatedAt: new Date(dbWatermark.updated_at)
    };
  }
}