import { createClient } from '@supabase/supabase-js';
import { ABExperiment, ABVariant, ABUserAssignment, ABConversionEvent, ABExperimentResults, StatisticalTest } from '@/types/ab-testing';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class ABTestingEngine {
  // Get user's assigned variant for an experiment
  static async getUserVariant(userId: string, experimentId: string): Promise<ABVariant | null> {
    try {
      // Check if user is already assigned
      const { data: assignment } = await supabase
        .from('ab_user_assignments')
        .select(`
          *,
          experiments!inner(
            id,
            status,
            variants
          )
        `)
        .eq('user_id', userId)
        .eq('experiment_id', experimentId)
        .eq('experiments.status', 'running')
        .single();

      if (assignment && assignment.experiments) {
        // Find the assigned variant
        const experiment = assignment.experiments;
        const variant = experiment.variants.find((v: ABVariant) => v.id === assignment.variant_id);

        if (variant) {
          // Update last seen
          await this.updateLastSeen(assignment.id);
          return variant;
        }
      }

      // Get experiment details
      const { data: experiment, error: expError } = await supabase
        .from('ab_experiments')
        .select('*')
        .eq('id', experimentId)
        .eq('status', 'running')
        .single();

      if (expError || !experiment) {
        return null;
      }

      // Check if user qualifies for this experiment
      const qualifies = await this.userQualifiesForExperiment(userId, experiment);
      if (!qualifies) {
        return null;
      }

      // Assign user to a variant
      const assignedVariant = await this.assignUserToVariant(userId, experiment);
      return assignedVariant;

    } catch (error) {
      console.error('Error getting user variant:', error);
      return null;
    }
  }

  // Assign user to a variant based on traffic split
  static async assignUserToVariant(userId: string, experiment: any): Promise<ABVariant | null> {
    try {
      // Check traffic allocation first
      const userHash = this.hashUserId(userId + experiment.id);
      const trafficThreshold = experiment.traffic_allocation / 100;

      if (userHash > trafficThreshold) {
        return null; // User not included in experiment
      }

      // Determine variant based on traffic split
      const variants: ABVariant[] = experiment.variants;
      const variantHash = this.hashUserId(userId + experiment.id + 'variant');

      let cumulativeWeight = 0;
      let selectedVariant: ABVariant | null = null;

      for (const variant of variants) {
        cumulativeWeight += variant.trafficSplit / 100;
        if (variantHash <= cumulativeWeight) {
          selectedVariant = variant;
          break;
        }
      }

      if (!selectedVariant) {
        selectedVariant = variants[0]; // Fallback to first variant
      }

      // Create assignment record
      await supabase
        .from('ab_user_assignments')
        .insert({
          user_id: userId,
          experiment_id: experiment.id,
          variant_id: selectedVariant.id,
          assigned_at: new Date().toISOString(),
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          converted: false
        });

      return selectedVariant;

    } catch (error) {
      console.error('Error assigning user to variant:', error);
      return null;
    }
  }

  // Check if user qualifies for experiment
  static async userQualifiesForExperiment(userId: string, experiment: any): Promise<boolean> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier, created_at')
        .eq('id', userId)
        .single();

      if (!profile) return false;

      const targetAudience = experiment.target_audience;

      // Check user tier
      if (targetAudience.userTiers && !targetAudience.userTiers.includes(profile.tier)) {
        return false;
      }

      // Check account age
      if (targetAudience.minAccountAge) {
        const accountAge = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (accountAge < targetAudience.minAccountAge) {
          return false;
        }
      }

      // Check excluded users
      if (targetAudience.excludeUserIds && targetAudience.excludeUserIds.includes(userId)) {
        return false;
      }

      // Check if user is already in another experiment of the same feature
      const { data: existingAssignments } = await supabase
        .from('ab_user_assignments')
        .select(`
          *,
          ab_experiments!inner(feature)
        `)
        .eq('user_id', userId)
        .eq('ab_experiments.feature', experiment.feature)
        .eq('ab_experiments.status', 'running')
        .neq('experiment_id', experiment.id);

      return !existingAssignments || existingAssignments.length === 0;

    } catch (error) {
      console.error('Error checking user qualification:', error);
      return false;
    }
  }

  // Track conversion event
  static async trackConversion(
    userId: string,
    experimentId: string,
    eventType: string,
    eventData: Record<string, any> = {},
    conversionValue: number = 0
  ): Promise<void> {
    try {
      // Get user assignment
      const { data: assignment } = await supabase
        .from('ab_user_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('experiment_id', experimentId)
        .single();

      if (!assignment) return;

      // Record conversion event
      await supabase
        .from('ab_conversion_events')
        .insert({
          user_id: userId,
          experiment_id: experimentId,
          variant_id: assignment.variant_id,
          event_type: eventType,
          event_data: eventData,
          conversion_value: conversionValue,
          occurred_at: new Date().toISOString()
        });

      // Update assignment if this is the primary conversion
      const { data: experiment } = await supabase
        .from('ab_experiments')
        .select('conversion_goal')
        .eq('id', experimentId)
        .single();

      if (experiment && eventType === experiment.conversion_goal && !assignment.converted) {
        await supabase
          .from('ab_user_assignments')
          .update({
            converted: true,
            converted_at: new Date().toISOString()
          })
          .eq('id', assignment.id);
      }

    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }

  // Calculate experiment results with statistical significance
  static async calculateExperimentResults(experimentId: string): Promise<ABExperimentResults | null> {
    try {
      const { data: experiment } = await supabase
        .from('ab_experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (!experiment) return null;

      // Get variant results
      const variantResults = await this.getVariantResults(experimentId);

      if (variantResults.length < 2) {
        return {
          status: 'insufficient_data',
          confidence: 0,
          pValue: 1,
          effect: 0,
          variantResults,
          dailyResults: [],
          calculatedAt: new Date()
        };
      }

      // Perform statistical test
      const controlVariant = variantResults.find(v => experiment.variants.find((ev: ABVariant) => ev.id === v.variantId && ev.isControl));
      const testVariants = variantResults.filter(v => v !== controlVariant);

      if (!controlVariant || testVariants.length === 0) {
        return {
          status: 'insufficient_data',
          confidence: 0,
          pValue: 1,
          effect: 0,
          variantResults,
          dailyResults: [],
          calculatedAt: new Date()
        };
      }

      // Calculate statistical significance for each test variant
      let bestVariant = controlVariant;
      let bestPValue = 1;
      let bestEffect = 0;

      for (const testVariant of testVariants) {
        const stats = this.calculateStatisticalSignificance(
          controlVariant.participants,
          controlVariant.conversions,
          testVariant.participants,
          testVariant.conversions
        );

        if (stats.pValue < bestPValue && stats.effect > 0) {
          bestVariant = testVariant;
          bestPValue = stats.pValue;
          bestEffect = stats.effect;
        }
      }

      // Determine status
      let status: ABExperimentResults['status'] = 'no_significant_difference';
      const significanceThreshold = 1 - (experiment.confidence_level / 100);

      if (bestPValue < significanceThreshold) {
        if (bestEffect > 0) {
          status = 'significant_winner';
        } else {
          status = 'significant_loser';
        }
      }

      // Get daily results
      const dailyResults = await this.getDailyResults(experimentId);

      return {
        status,
        winningVariant: status === 'significant_winner' ? bestVariant.variantId : undefined,
        confidence: Math.max(0, (1 - bestPValue) * 100),
        pValue: bestPValue,
        effect: bestEffect,
        variantResults,
        dailyResults,
        calculatedAt: new Date()
      };

    } catch (error) {
      console.error('Error calculating experiment results:', error);
      return null;
    }
  }

  // Get variant performance results
  static async getVariantResults(experimentId: string) {
    const { data: assignments } = await supabase
      .from('ab_user_assignments')
      .select('variant_id, converted')
      .eq('experiment_id', experimentId);

    if (!assignments) return [];

    const variantStats = assignments.reduce((acc, assignment) => {
      if (!acc[assignment.variant_id]) {
        acc[assignment.variant_id] = { participants: 0, conversions: 0 };
      }
      acc[assignment.variant_id].participants++;
      if (assignment.converted) {
        acc[assignment.variant_id].conversions++;
      }
      return acc;
    }, {} as Record<string, { participants: number; conversions: number }>);

    return Object.entries(variantStats).map(([variantId, stats]) => ({
      variantId,
      participants: stats.participants,
      conversions: stats.conversions,
      conversionRate: stats.participants > 0 ? stats.conversions / stats.participants : 0,
      confidence: this.calculateConfidenceInterval(stats.conversions, stats.participants),
      secondaryMetrics: {}
    }));
  }

  // Get daily results for trending
  static async getDailyResults(experimentId: string) {
    const { data: assignments } = await supabase
      .from('ab_user_assignments')
      .select('variant_id, converted, assigned_at')
      .eq('experiment_id', experimentId)
      .order('assigned_at', { ascending: true });

    if (!assignments) return [];

    const dailyStats = assignments.reduce((acc, assignment) => {
      const date = new Date(assignment.assigned_at).toDateString();
      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][assignment.variant_id]) {
        acc[date][assignment.variant_id] = { participants: 0, conversions: 0 };
      }
      acc[date][assignment.variant_id].participants++;
      if (assignment.converted) {
        acc[date][assignment.variant_id].conversions++;
      }
      return acc;
    }, {} as Record<string, Record<string, { participants: number; conversions: number }>>);

    return Object.entries(dailyStats).map(([dateStr, variants]) => ({
      date: new Date(dateStr),
      variantResults: Object.entries(variants).map(([variantId, stats]) => ({
        variantId,
        participants: stats.participants,
        conversions: stats.conversions,
        conversionRate: stats.participants > 0 ? stats.conversions / stats.participants : 0
      }))
    }));
  }

  // Statistical significance calculation using chi-square test
  static calculateStatisticalSignificance(
    controlParticipants: number,
    controlConversions: number,
    testParticipants: number,
    testConversions: number
  ): StatisticalTest {
    const controlRate = controlParticipants > 0 ? controlConversions / controlParticipants : 0;
    const testRate = testParticipants > 0 ? testConversions / testParticipants : 0;

    // Calculate pooled rate
    const pooledRate = (controlConversions + testConversions) / (controlParticipants + testParticipants);

    // Calculate standard error
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / controlParticipants + 1 / testParticipants)
    );

    // Calculate z-score
    const zScore = Math.abs(testRate - controlRate) / standardError;

    // Calculate p-value (two-tailed test)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Calculate effect size (percentage improvement)
    const effect = controlRate > 0 ? ((testRate - controlRate) / controlRate) * 100 : 0;

    return {
      testType: 'chi_square',
      pValue: Math.max(0, Math.min(1, pValue)),
      confidence: Math.max(0, (1 - pValue) * 100),
      significant: pValue < 0.05,
      effect,
      powerAnalysis: {
        power: 0.8, // Standard 80% power
        sampleSizeNeeded: this.calculateSampleSize(controlRate, effect, 0.05, 0.8),
        actualSampleSize: controlParticipants + testParticipants
      }
    };
  }

  // Helper methods
  private static hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  private static async updateLastSeen(assignmentId: string): Promise<void> {
    await supabase
      .from('ab_user_assignments')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', assignmentId);
  }

  private static calculateConfidenceInterval(successes: number, trials: number): [number, number] {
    if (trials === 0) return [0, 0];

    const p = successes / trials;
    const z = 1.96; // 95% confidence interval
    const margin = z * Math.sqrt((p * (1 - p)) / trials);

    return [
      Math.max(0, p - margin),
      Math.min(1, p + margin)
    ];
  }

  private static normalCDF(x: number): number {
    // Approximation of the cumulative distribution function for standard normal distribution
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private static calculateSampleSize(
    baselineRate: number,
    minimumEffect: number,
    alpha: number = 0.05,
    power: number = 0.8
  ): number {
    // Simplified sample size calculation for proportion tests
    const zAlpha = 1.96; // 95% confidence
    const zBeta = 0.84; // 80% power

    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumEffect / 100);

    const pooledP = (p1 + p2) / 2;
    const delta = Math.abs(p2 - p1);

    const numerator = Math.pow(zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const denominator = Math.pow(delta, 2);

    return Math.ceil(numerator / denominator);
  }
}