import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// AI Provider interfaces
export interface AIContext {
  selectedText?: string;
  characters?: string[];
  settings?: string[];
  genre?: string;
  currentScene?: string;
}

export interface AIProvider {
  name: string;
  generateCompletion(prompt: string, context?: AIContext): Promise<string>;
  getCostPerToken(): number;
  getTokenLimit(): number;
}

// OpenAI Provider (Premium users)
class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
      organization: process.env.OPENAI_ORG_ID,
    });
  }

  async generateCompletion(prompt: string, context?: AIContext): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a professional writing assistant specializing in creative writing. ${context ? `Context: ${JSON.stringify(context)}` : ''}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  getCostPerToken(): number {
    return 0.00003; // $0.03 per 1K tokens for GPT-4 Turbo
  }

  getTokenLimit(): number {
    return 128000; // GPT-4 Turbo context limit
  }
}

// Anthropic Provider (Premium users)
class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async generateCompletion(prompt: string, context?: AIContext): Promise<string> {
    try {
      const systemPrompt = `You are a professional writing assistant specializing in creative writing. ${context ? `Context: ${JSON.stringify(context)}` : ''}`;

      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      return response.content[0]?.type === 'text' ? response.content[0].text : 'No response generated';
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error('Failed to generate response from Anthropic');
    }
  }

  getCostPerToken(): number {
    return 0.000015; // $0.015 per 1K tokens for Claude-3 Sonnet
  }

  getTokenLimit(): number {
    return 200000; // Claude-3 context limit
  }
}

// DeepSeek Provider (Free users with limitations)
class DeepSeekProvider implements AIProvider {
  name = 'deepseek';

  async generateCompletion(prompt: string, context?: AIContext): Promise<string> {
    try {
      // DeepSeek API integration (placeholder for actual implementation)
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a professional writing assistant specializing in creative writing. ${context ? `Context: ${JSON.stringify(context)}` : ''}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500, // Limited for free users
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw new Error('Failed to generate response from DeepSeek');
    }
  }

  getCostPerToken(): number {
    return 0; // Free for basic usage
  }

  getTokenLimit(): number {
    return 4000; // Limited context for free users
  }
}

// AI Provider Factory
export class AIProviderFactory {
  private static providers: Map<string, AIProvider> = new Map();

  static getProvider(userTier: 'free' | 'premium' | 'enterprise'): AIProvider {
    let providerName: string;

    switch (userTier) {
      case 'enterprise':
      case 'premium':
        providerName = Math.random() > 0.5 ? 'openai' : 'anthropic'; // Load balance between premium providers
        break;
      case 'free':
      default:
        providerName = 'deepseek';
        break;
    }

    if (!this.providers.has(providerName)) {
      switch (providerName) {
        case 'openai':
          this.providers.set(providerName, new OpenAIProvider());
          break;
        case 'anthropic':
          this.providers.set(providerName, new AnthropicProvider());
          break;
        case 'deepseek':
          this.providers.set(providerName, new DeepSeekProvider());
          break;
        default:
          throw new Error(`Unknown AI provider: ${providerName}`);
      }
    }

    return this.providers.get(providerName)!;
  }
}

// Usage tracking
export interface AIUsageTracker {
  trackUsage(userId: string, provider: string, tokensUsed: number, requestType: string): Promise<void>;
  checkUsageLimit(userId: string, userTier: string): Promise<boolean>;
  getUserUsage(userId: string): Promise<number>;
}

export class SupabaseAIUsageTracker implements AIUsageTracker {
  async trackUsage(userId: string, provider: string, tokensUsed: number, requestType: string): Promise<void> {
    const { error } = await supabase
      .from('ai_usage')
      .insert({
        user_id: userId,
        api_provider: provider,
        tokens_used: tokensUsed,
        request_type: requestType,
      });

    if (error) {
      console.error('Error tracking AI usage:', error);
    }
  }

  async checkUsageLimit(userId: string, userTier: string): Promise<boolean> {
    const limits = {
      free: 10000, // 10K tokens per month
      premium: 1000000, // 1M tokens per month
      enterprise: -1, // Unlimited
    };

    const limit = limits[userTier as keyof typeof limits];
    if (limit === -1) return true; // Unlimited

    const currentUsage = await this.getUserUsage(userId);
    return currentUsage < limit;
  }

  async getUserUsage(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('ai_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error fetching user usage:', error);
      return 0;
    }

    return data?.reduce((total, record) => total + record.tokens_used, 0) || 0;
  }
}

import { supabase } from './supabase';