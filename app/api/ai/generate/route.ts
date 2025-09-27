import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AIProviderFactory, SupabaseAIUsageTracker } from '@/lib/ai-providers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { prompt, context, requestType, userId, userTier } = await request.json();

    // Validate request
    if (!prompt || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user authentication
    const { data: user, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check usage limits
    const usageTracker = new SupabaseAIUsageTracker();
    const canUse = await usageTracker.checkUsageLimit(userId, userTier);

    if (!canUse) {
      return NextResponse.json(
        { error: 'Monthly usage limit exceeded. Please upgrade your plan.' },
        { status: 429 }
      );
    }

    // Get appropriate AI provider
    const provider = AIProviderFactory.getProvider(userTier);

    // Generate content
    const content = await provider.generateCompletion(prompt, context);

    // Track usage
    const tokensUsed = Math.ceil(content.length / 4); // Rough estimation
    await usageTracker.trackUsage(userId, provider.name, tokensUsed, requestType);

    return NextResponse.json({
      content,
      tokensUsed,
      provider: provider.name,
    });

  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const usageTracker = new SupabaseAIUsageTracker();
    const usage = await usageTracker.getUserUsage(userId);

    return NextResponse.json({ usage });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}