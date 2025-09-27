import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface WatermarkConfig {
  id: string;
  name: string;
  text: string;
  opacity: number;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  fontSize: number;
  isActive: boolean;
  tierRequired: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export function useWatermarks() {
  const [watermarks, setWatermarks] = useState<WatermarkConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchWatermarks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('watermark_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedWatermarks: WatermarkConfig[] = data.map(wm => ({
        id: wm.id,
        name: wm.name,
        text: wm.text,
        opacity: parseFloat(wm.opacity.toString()),
        position: wm.position,
        fontSize: wm.font_size,
        isActive: wm.is_active,
        tierRequired: wm.tier_required,
        createdAt: new Date(wm.created_at),
        updatedAt: new Date(wm.updated_at)
      }));

      setWatermarks(formattedWatermarks);

      // If no watermarks exist, create default ones
      if (formattedWatermarks.length === 0) {
        await createDefaultWatermarks();
      }
    } catch (err) {
      console.error('Error fetching watermarks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch watermarks');
      toast.error('Failed to load watermarks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDefaultWatermarks = async () => {
    const defaultWatermarks = [
      {
        name: 'Free Tier Watermark',
        text: 'Created with OttoWrite - Upgrade for watermark-free exports',
        opacity: 0.3,
        position: 'bottom-right' as const,
        font_size: 12,
        is_active: true,
        tier_required: 'free' as const
      },
      {
        name: 'Premium Promotion',
        text: 'Powered by OttoWrite AI',
        opacity: 0.2,
        position: 'center' as const,
        font_size: 14,
        is_active: false,
        tier_required: 'premium' as const
      }
    ];

    try {
      const { data, error } = await supabase
        .from('watermark_configs')
        .insert(defaultWatermarks)
        .select();

      if (error) throw error;

      const formatted = data.map(wm => ({
        id: wm.id,
        name: wm.name,
        text: wm.text,
        opacity: parseFloat(wm.opacity.toString()),
        position: wm.position,
        fontSize: wm.font_size,
        isActive: wm.is_active,
        tierRequired: wm.tier_required,
        createdAt: new Date(wm.created_at),
        updatedAt: new Date(wm.updated_at)
      }));

      setWatermarks(formatted);
    } catch (err) {
      console.error('Error creating default watermarks:', err);
    }
  };

  const createWatermark = useCallback(async (watermarkData: Omit<WatermarkConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('watermark_configs')
        .insert({
          name: watermarkData.name,
          text: watermarkData.text,
          opacity: watermarkData.opacity,
          position: watermarkData.position,
          font_size: watermarkData.fontSize,
          is_active: watermarkData.isActive,
          tier_required: watermarkData.tierRequired
        })
        .select()
        .single();

      if (error) throw error;

      const newWatermark: WatermarkConfig = {
        id: data.id,
        name: data.name,
        text: data.text,
        opacity: parseFloat(data.opacity.toString()),
        position: data.position,
        fontSize: data.font_size,
        isActive: data.is_active,
        tierRequired: data.tier_required,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setWatermarks(prev => [newWatermark, ...prev]);
      toast.success('Watermark created successfully!');
      return newWatermark;
    } catch (err) {
      console.error('Error creating watermark:', err);
      toast.error('Failed to create watermark');
      return null;
    }
  }, []);

  const updateWatermark = useCallback(async (watermarkId: string, updates: Partial<WatermarkConfig>) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.text !== undefined) updateData.text = updates.text;
      if (updates.opacity !== undefined) updateData.opacity = updates.opacity;
      if (updates.position !== undefined) updateData.position = updates.position;
      if (updates.fontSize !== undefined) updateData.font_size = updates.fontSize;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.tierRequired !== undefined) updateData.tier_required = updates.tierRequired;

      const { data, error } = await supabase
        .from('watermark_configs')
        .update(updateData)
        .eq('id', watermarkId)
        .select()
        .single();

      if (error) throw error;

      const updatedWatermark: WatermarkConfig = {
        id: data.id,
        name: data.name,
        text: data.text,
        opacity: parseFloat(data.opacity.toString()),
        position: data.position,
        fontSize: data.font_size,
        isActive: data.is_active,
        tierRequired: data.tier_required,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setWatermarks(prev => prev.map(wm => wm.id === watermarkId ? updatedWatermark : wm));
      toast.success('Watermark updated successfully!');
      return updatedWatermark;
    } catch (err) {
      console.error('Error updating watermark:', err);
      toast.error('Failed to update watermark');
      return null;
    }
  }, []);

  const deleteWatermark = useCallback(async (watermarkId: string) => {
    try {
      const { error } = await supabase
        .from('watermark_configs')
        .delete()
        .eq('id', watermarkId);

      if (error) throw error;

      setWatermarks(prev => prev.filter(wm => wm.id !== watermarkId));
      toast.success('Watermark deleted successfully!');
      return true;
    } catch (err) {
      console.error('Error deleting watermark:', err);
      toast.error('Failed to delete watermark');
      return false;
    }
  }, []);

  const getActiveWatermarkForTier = useCallback((tier: 'free' | 'premium' | 'enterprise'): WatermarkConfig | null => {
    // Free tier users get watermarks, premium+ users don't (unless specifically configured)
    if (tier !== 'free') {
      const premiumWatermark = watermarks.find(wm =>
        wm.isActive &&
        wm.tierRequired === tier
      );
      return premiumWatermark || null;
    }

    // Free tier gets the active free watermark
    return watermarks.find(wm =>
      wm.isActive &&
      wm.tierRequired === 'free'
    ) || null;
  }, [watermarks]);

  const toggleWatermark = useCallback(async (watermarkId: string) => {
    const watermark = watermarks.find(wm => wm.id === watermarkId);
    if (!watermark) return null;

    return updateWatermark(watermarkId, { isActive: !watermark.isActive });
  }, [watermarks, updateWatermark]);

  useEffect(() => {
    fetchWatermarks();
  }, [fetchWatermarks]);

  return {
    watermarks,
    isLoading,
    error,
    createWatermark,
    updateWatermark,
    deleteWatermark,
    toggleWatermark,
    getActiveWatermarkForTier,
    refetch: fetchWatermarks
  };
}