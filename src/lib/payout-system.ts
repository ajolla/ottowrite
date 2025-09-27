import { createClient } from '@supabase/supabase-js';
import { PayoutRecord, ReferralConversion, InfluencerPartner } from '@/types/referral';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export class PayoutSystemManager {
  // Calculate earnings eligible for payout
  static async calculatePayoutEligibleEarnings(influencerId: string): Promise<{
    eligibleAmount: number;
    conversionIds: string[];
    pendingConversions: ReferralConversion[];
  }> {
    try {
      // Get all approved conversions that haven't been paid yet
      const { data: conversions, error } = await supabase
        .from('referral_conversions')
        .select('*')
        .eq('influencer_id', influencerId)
        .eq('commission_status', 'approved')
        .is('payout_record_id', null); // Not yet included in a payout

      if (error) throw error;

      const eligibleAmount = conversions?.reduce((total, conversion) => {
        return total + conversion.commission_amount;
      }, 0) || 0;

      const conversionIds = conversions?.map(c => c.id) || [];

      return {
        eligibleAmount,
        conversionIds,
        pendingConversions: conversions || []
      };
    } catch (error) {
      console.error('Error calculating payout eligible earnings:', error);
      throw error;
    }
  }

  // Create a payout record
  static async createPayout(
    influencerId: string,
    amount: number,
    conversionIds: string[],
    payoutMethod: 'paypal' | 'stripe' | 'bank_transfer',
    payoutDetails: Record<string, string>,
    processedBy: string,
    scheduledFor?: Date
  ): Promise<PayoutRecord> {
    try {
      // Start a transaction
      const { data: payout, error: payoutError } = await supabase
        .from('payout_records')
        .insert({
          influencer_id: influencerId,
          amount,
          currency: 'USD',
          payout_method: payoutMethod,
          payout_details: payoutDetails,
          status: 'pending',
          conversion_ids: conversionIds,
          scheduled_for: scheduledFor?.toISOString(),
          processed_by: processedBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Update conversions to reference this payout
      const { error: updateError } = await supabase
        .from('referral_conversions')
        .update({ payout_record_id: payout.id })
        .in('id', conversionIds);

      if (updateError) throw updateError;

      // Update influencer partner pending/paid earnings
      await this.updateInfluencerEarnings(influencerId, -amount, amount);

      return this.transformPayoutFromDb(payout);
    } catch (error) {
      console.error('Error creating payout:', error);
      throw error;
    }
  }

  // Process a payout (mark as processing/completed)
  static async processPayout(
    payoutId: string,
    status: 'processing' | 'completed' | 'failed' | 'cancelled',
    transactionId?: string,
    failureReason?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'processing' || status === 'completed') {
        updateData.processed_at = new Date().toISOString();
      }

      if (transactionId) {
        updateData.transaction_id = transactionId;
      }

      if (failureReason) {
        updateData.failure_reason = failureReason;
      }

      const { error } = await supabase
        .from('payout_records')
        .update(updateData)
        .eq('id', payoutId);

      if (error) throw error;

      // If payout failed or was cancelled, update influencer earnings
      if (status === 'failed' || status === 'cancelled') {
        const { data: payout } = await supabase
          .from('payout_records')
          .select('influencer_id, amount')
          .eq('id', payoutId)
          .single();

        if (payout) {
          // Move amount back from paid to pending
          await this.updateInfluencerEarnings(payout.influencer_id, payout.amount, -payout.amount);

          // Update conversions to remove payout reference
          await supabase
            .from('referral_conversions')
            .update({ payout_record_id: null })
            .eq('payout_record_id', payoutId);
        }
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      throw error;
    }
  }

  // Get payout history for an influencer
  static async getInfluencerPayouts(influencerId: string, limit = 50): Promise<PayoutRecord[]> {
    try {
      const { data: payouts, error } = await supabase
        .from('payout_records')
        .select('*')
        .eq('influencer_id', influencerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return payouts?.map(this.transformPayoutFromDb) || [];
    } catch (error) {
      console.error('Error getting influencer payouts:', error);
      throw error;
    }
  }

  // Get all pending payouts (for admin)
  static async getPendingPayouts(): Promise<PayoutRecord[]> {
    try {
      const { data: payouts, error } = await supabase
        .from('payout_records')
        .select(`
          *,
          influencer_partners!inner(
            business_name,
            contact_email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return payouts?.map(this.transformPayoutFromDb) || [];
    } catch (error) {
      console.error('Error getting pending payouts:', error);
      throw error;
    }
  }

  // Bulk approve conversions for payout
  static async bulkApproveConversions(conversionIds: string[], approvedBy: string): Promise<number> {
    try {
      const { data: conversions, error } = await supabase
        .from('referral_conversions')
        .update({
          commission_status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', conversionIds)
        .eq('commission_status', 'pending')
        .select('commission_amount');

      if (error) throw error;

      return conversions?.length || 0;
    } catch (error) {
      console.error('Error bulk approving conversions:', error);
      throw error;
    }
  }

  // Auto-approve conversions older than X days
  static async autoApproveConversions(daysOld = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data: conversions, error } = await supabase
        .from('referral_conversions')
        .update({
          commission_status: 'approved',
          approved_by: 'system',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('commission_status', 'pending')
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      return conversions?.length || 0;
    } catch (error) {
      console.error('Error auto-approving conversions:', error);
      throw error;
    }
  }

  // Generate payout summary for admin
  static async generatePayoutSummary(startDate?: Date, endDate?: Date): Promise<{
    totalPayouts: number;
    totalAmount: number;
    payoutsByStatus: Record<string, number>;
    payoutsByMethod: Record<string, number>;
    averagePayoutAmount: number;
    pendingAmount: number;
  }> {
    try {
      let query = supabase.from('payout_records').select('amount, status, payout_method');

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: payouts, error } = await query;

      if (error) throw error;

      const totalPayouts = payouts?.length || 0;
      const totalAmount = payouts?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const averagePayoutAmount = totalPayouts > 0 ? totalAmount / totalPayouts : 0;

      const payoutsByStatus = payouts?.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const payoutsByMethod = payouts?.reduce((acc, p) => {
        acc[p.payout_method] = (acc[p.payout_method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const pendingAmount = payouts?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      return {
        totalPayouts,
        totalAmount,
        payoutsByStatus,
        payoutsByMethod,
        averagePayoutAmount,
        pendingAmount
      };
    } catch (error) {
      console.error('Error generating payout summary:', error);
      throw error;
    }
  }

  // PayPal integration placeholder
  static async processPayPalPayout(
    payoutId: string,
    recipientEmail: string,
    amount: number,
    currency = 'USD'
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // This is a placeholder for PayPal API integration
      // In a real implementation, you would use PayPal's Payouts API

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success/failure
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        const transactionId = `PP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.processPayout(payoutId, 'completed', transactionId);
        return { success: true, transactionId };
      } else {
        await this.processPayout(payoutId, 'failed', undefined, 'PayPal processing failed');
        return { success: false, error: 'PayPal processing failed' };
      }
    } catch (error) {
      console.error('PayPal payout error:', error);
      await this.processPayout(payoutId, 'failed', undefined, 'PayPal integration error');
      return { success: false, error: 'PayPal integration error' };
    }
  }

  // Helper methods
  private static async updateInfluencerEarnings(
    influencerId: string,
    pendingDelta: number,
    paidDelta: number
  ): Promise<void> {
    const { error } = await supabase.rpc('update_influencer_earnings', {
      influencer_id: influencerId,
      pending_delta: pendingDelta,
      paid_delta: paidDelta
    });

    if (error) throw error;
  }

  private static transformPayoutFromDb(dbPayout: any): PayoutRecord {
    return {
      id: dbPayout.id,
      influencerId: dbPayout.influencer_id,
      amount: dbPayout.amount,
      currency: dbPayout.currency,
      payoutMethod: dbPayout.payout_method,
      payoutDetails: dbPayout.payout_details || {},
      status: dbPayout.status,
      transactionId: dbPayout.transaction_id,
      conversionIds: dbPayout.conversion_ids || [],
      scheduledFor: dbPayout.scheduled_for ? new Date(dbPayout.scheduled_for) : undefined,
      processedAt: dbPayout.processed_at ? new Date(dbPayout.processed_at) : undefined,
      failureReason: dbPayout.failure_reason,
      processedBy: dbPayout.processed_by,
      createdAt: new Date(dbPayout.created_at),
      updatedAt: new Date(dbPayout.updated_at)
    };
  }
}