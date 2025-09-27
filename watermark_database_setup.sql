-- Watermark System Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Watermark Configurations Table
CREATE TABLE IF NOT EXISTS watermark_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  sub_text TEXT,
  position TEXT NOT NULL DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left', 'bottom-center', 'top-right', 'top-left')),
  style JSONB NOT NULL DEFAULT '{
    "fontSize": 10,
    "color": "#6B7280",
    "opacity": 0.8,
    "fontFamily": "Inter, sans-serif",
    "backgroundColor": "#F9FAFB",
    "borderColor": "#E5E7EB",
    "borderWidth": 1,
    "padding": 8,
    "borderRadius": 4
  }'::jsonb,
  for_user_tiers TEXT[] NOT NULL DEFAULT '{free}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Document Watermarks Table (tracking applied watermarks)
CREATE TABLE IF NOT EXISTS document_watermarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL, -- Reference to your documents table
  user_id UUID REFERENCES user_profiles(id),
  user_tier TEXT NOT NULL CHECK (user_tier IN ('free', 'premium', 'enterprise')),
  watermark_config JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'html', 'print'))
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_watermark_configs_active ON watermark_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_watermark_configs_tiers ON watermark_configs USING GIN(for_user_tiers);
CREATE INDEX IF NOT EXISTS idx_document_watermarks_user ON document_watermarks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_watermarks_document ON document_watermarks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_watermarks_format ON document_watermarks(format);

-- 4. Insert default watermark configurations
INSERT INTO watermark_configs (name, text, sub_text, position, style, for_user_tiers, is_active) VALUES
(
  'Default Free User',
  'Created with OttoWrite AI',
  'Upgrade for watermark-free exports',
  'bottom-right',
  '{
    "fontSize": 10,
    "color": "#6B7280",
    "opacity": 0.8,
    "fontFamily": "Inter, sans-serif",
    "backgroundColor": "#F9FAFB",
    "borderColor": "#E5E7EB",
    "borderWidth": 1,
    "padding": 8,
    "borderRadius": 4
  }'::jsonb,
  '{free}',
  true
),
(
  'Subtle Branding',
  'OttoWrite.ai',
  NULL,
  'bottom-right',
  '{
    "fontSize": 8,
    "color": "#9CA3AF",
    "opacity": 0.6,
    "fontFamily": "Inter, sans-serif",
    "backgroundColor": null,
    "borderColor": null,
    "borderWidth": 0,
    "padding": 4,
    "borderRadius": 2
  }'::jsonb,
  '{free}',
  false
),
(
  'Upgrade Prompt',
  'Upgrade to Premium',
  'Remove watermarks & unlock AI features',
  'bottom-center',
  '{
    "fontSize": 11,
    "color": "#3B82F6",
    "opacity": 0.9,
    "fontFamily": "Inter, sans-serif",
    "backgroundColor": "#EFF6FF",
    "borderColor": "#DBEAFE",
    "borderWidth": 1,
    "padding": 10,
    "borderRadius": 6
  }'::jsonb,
  '{free}',
  false
);

-- 5. Enable Row Level Security
ALTER TABLE watermark_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_watermarks ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Admin can manage all watermark configs
CREATE POLICY "Admin full access on watermark_configs" ON watermark_configs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public can read active watermark configs (for frontend usage)
CREATE POLICY "Public can read active watermark configs" ON watermark_configs
  FOR SELECT USING (is_active = true);

-- Users can only see their own watermark applications
CREATE POLICY "Users see own watermark applications" ON document_watermarks
  FOR SELECT USING (user_id = auth.uid());

-- Admin can see all watermark applications
CREATE POLICY "Admin see all watermark applications" ON document_watermarks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- System can insert watermark tracking records
CREATE POLICY "System can track watermark applications" ON document_watermarks
  FOR INSERT WITH CHECK (true);

-- 7. Create function to get active watermark for user tier
CREATE OR REPLACE FUNCTION get_active_watermark_for_tier(user_tier_param TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  text TEXT,
  sub_text TEXT,
  position TEXT,
  style JSONB,
  for_user_tiers TEXT[],
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wc.id,
    wc.name,
    wc.text,
    wc.sub_text,
    wc.position,
    wc.style,
    wc.for_user_tiers,
    wc.is_active,
    wc.created_at,
    wc.updated_at
  FROM watermark_configs wc
  WHERE wc.is_active = true
    AND user_tier_param = ANY(wc.for_user_tiers)
  ORDER BY wc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to track watermark usage statistics
CREATE OR REPLACE FUNCTION get_watermark_usage_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_applications BIGINT,
  applications_by_format JSONB,
  applications_by_tier JSONB,
  top_documents TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_applications,
    jsonb_object_agg(dw.format, format_count) as applications_by_format,
    jsonb_object_agg(dw.user_tier, tier_count) as applications_by_tier,
    ARRAY_AGG(DISTINCT dw.document_id ORDER BY dw.document_id LIMIT 10) as top_documents
  FROM document_watermarks dw
  LEFT JOIN (
    SELECT format, COUNT(*) as format_count
    FROM document_watermarks
    WHERE applied_at BETWEEN start_date AND end_date
    GROUP BY format
  ) fc ON dw.format = fc.format
  LEFT JOIN (
    SELECT user_tier, COUNT(*) as tier_count
    FROM document_watermarks
    WHERE applied_at BETWEEN start_date AND end_date
    GROUP BY user_tier
  ) tc ON dw.user_tier = tc.user_tier
  WHERE dw.applied_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create automated cleanup function for old watermark tracking records
CREATE OR REPLACE FUNCTION cleanup_old_watermark_records()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM document_watermarks
  WHERE applied_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create a scheduled job to run cleanup (optional - requires pg_cron extension)
-- SELECT cron.schedule('cleanup-watermark-records', '0 2 * * 0', 'SELECT cleanup_old_watermark_records();');

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON watermark_configs TO anon, authenticated;
GRANT SELECT, INSERT ON document_watermarks TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_watermark_for_tier(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_watermark_usage_stats(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Watermark system database setup completed successfully!';
  RAISE NOTICE 'Tables created: watermark_configs, document_watermarks';
  RAISE NOTICE 'Default watermark configurations inserted';
  RAISE NOTICE 'Row Level Security enabled with appropriate policies';
  RAISE NOTICE 'Helper functions created for watermark management';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Add DocumentExporter component to your editor';
  RAISE NOTICE '2. Add WatermarkManager to your admin panel';
  RAISE NOTICE '3. Test watermark functionality with free user account';
END $$;