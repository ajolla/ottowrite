// API route handlers for AI functionality
export async function POST(request: Request) {
  try {
    const { prompt, context, requestType, userId, userTier } = await request.json();

    // Validate request
    if (!prompt || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Import AI providers
    const { AIProviderFactory, SupabaseAIUsageTracker } = await import('@/lib/ai-providers');

    // Check usage limits
    const usageTracker = new SupabaseAIUsageTracker();
    const canUse = await usageTracker.checkUsageLimit(userId, userTier);

    if (!canUse) {
      return Response.json(
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

    return Response.json({
      content,
      tokensUsed,
      provider: provider.name,
    });

  } catch (error) {
    console.error('AI API error:', error);
    return Response.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}