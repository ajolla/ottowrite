import { useState, useCallback } from 'react';
import { AIProviderFactory, SupabaseAIUsageTracker, AIContext } from '@/lib/ai-providers';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AIRequest {
  prompt: string;
  context?: AIContext;
  requestType: 'continue' | 'rewrite' | 'brainstorm' | 'character' | 'plot' | 'dialogue' | 'description' | 'custom';
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  provider: string;
}

export function useAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const { user, profile } = useAuth();

  const usageTracker = new SupabaseAIUsageTracker();

  const generateContent = useCallback(async (request: AIRequest): Promise<AIResponse | null> => {
    if (!user || !profile) {
      toast.error('Please sign in to use AI features');
      return null;
    }

    // Check usage limits
    const canUse = await usageTracker.checkUsageLimit(user.id, profile.tier);
    if (!canUse) {
      toast.error('You have reached your monthly AI usage limit. Please upgrade your plan.');
      return null;
    }

    setIsProcessing(true);

    try {
      const provider = AIProviderFactory.getProvider(profile.tier);

      // Build enhanced prompt based on request type and context
      const enhancedPrompt = buildEnhancedPrompt(request);

      const content = await provider.generateCompletion(enhancedPrompt, request.context);

      // Estimate tokens (rough approximation: 1 token = 4 characters)
      const tokensUsed = Math.ceil(content.length / 4);

      // Track usage
      await usageTracker.trackUsage(user.id, provider.name, tokensUsed, request.requestType);

      const response: AIResponse = {
        content,
        tokensUsed,
        provider: provider.name,
      };

      setLastResponse(response);
      return response;

    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate content. Please try again.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [user, profile]);

  const continueWriting = useCallback(async (selectedText: string, context?: AIContext) => {
    return generateContent({
      prompt: `Continue writing this story naturally, maintaining the same tone, style, and narrative voice. Build upon the current scene and advance the plot meaningfully.\n\nCurrent text: "${selectedText}"`,
      context: { selectedText, ...context },
      requestType: 'continue',
    });
  }, [generateContent]);

  const rewriteText = useCallback(async (selectedText: string, instructions?: string, context?: AIContext) => {
    const basePrompt = `Rewrite the following text to improve clarity, flow, and engagement while maintaining the original meaning and style.`;
    const prompt = instructions
      ? `${basePrompt} Additional instructions: ${instructions}\n\nText to rewrite: "${selectedText}"`
      : `${basePrompt}\n\nText to rewrite: "${selectedText}"`;

    return generateContent({
      prompt,
      context: { selectedText, ...context },
      requestType: 'rewrite',
    });
  }, [generateContent]);

  const brainstormIdeas = useCallback(async (topic: string, context?: AIContext) => {
    return generateContent({
      prompt: `Generate 5 creative and unique ideas for: ${topic}. Make them specific, interesting, and actionable for a creative writer.`,
      context,
      requestType: 'brainstorm',
    });
  }, [generateContent]);

  const developCharacter = useCallback(async (characterName: string, context?: AIContext) => {
    return generateContent({
      prompt: `Create a detailed character development for "${characterName}". Include personality traits, background, motivations, flaws, and how they might evolve throughout the story. Consider their role in the narrative and relationships with other characters.`,
      context: { ...context, characters: context?.characters || [characterName] },
      requestType: 'character',
    });
  }, [generateContent]);

  const generateDialogue = useCallback(async (characters: string[], situation: string, context?: AIContext) => {
    return generateContent({
      prompt: `Write natural, character-specific dialogue between ${characters.join(' and ')} in this situation: ${situation}. Make sure each character has a distinct voice and the dialogue advances the plot or reveals character.`,
      context: { ...context, characters },
      requestType: 'dialogue',
    });
  }, [generateContent]);

  const describeScene = useCallback(async (setting: string, mood: string, context?: AIContext) => {
    return generateContent({
      prompt: `Write a vivid, immersive description of ${setting} with a ${mood} mood. Use sensory details and avoid clichés. Make the setting feel alive and integral to the story.`,
      context: { ...context, settings: context?.settings || [setting] },
      requestType: 'description',
    });
  }, [generateContent]);

  const generatePlotTwist = useCallback(async (currentPlot: string, context?: AIContext) => {
    return generateContent({
      prompt: `Given this plot summary: "${currentPlot}", suggest 3 unexpected but logical plot twists that would enhance the story. Each twist should feel surprising yet inevitable in hindsight.`,
      context,
      requestType: 'plot',
    });
  }, [generateContent]);

  const customRequest = useCallback(async (prompt: string, context?: AIContext) => {
    return generateContent({
      prompt,
      context,
      requestType: 'custom',
    });
  }, [generateContent]);

  return {
    isProcessing,
    lastResponse,
    generateContent,
    continueWriting,
    rewriteText,
    brainstormIdeas,
    developCharacter,
    generateDialogue,
    describeScene,
    generatePlotTwist,
    customRequest,
  };
}

function buildEnhancedPrompt(request: AIRequest): string {
  let prompt = request.prompt;

  if (request.context) {
    const { genre, characters, settings, currentScene } = request.context;

    if (genre && genre !== 'General') {
      prompt += `\n\nGenre: ${genre}`;
    }

    if (characters && characters.length > 0) {
      prompt += `\n\nCharacters in this story: ${characters.join(', ')}`;
    }

    if (settings && settings.length > 0) {
      prompt += `\n\nStory settings/locations: ${settings.join(', ')}`;
    }

    if (currentScene) {
      prompt += `\n\nCurrent scene/chapter: ${currentScene}`;
    }
  }

  // Add general writing guidelines
  prompt += `\n\nGuidelines:
- Maintain consistency with established characters and world-building
- Use vivid, specific details rather than generic descriptions
- Show don't tell when possible
- Keep the pacing engaging
- Avoid repetitive language or clichés
- Make every word count`;

  return prompt;
}