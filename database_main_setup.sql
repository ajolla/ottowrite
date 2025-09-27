-- OttoWrite AI Canvas - Complete Database Schema
-- Run this first, then run database_stripe_setup.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'enterprise')),
  monthly_usage INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 10000,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  type TEXT CHECK (type IN ('novel', 'screenplay', 'stage-play', 'short-story')) DEFAULT 'novel',
  word_count INTEGER DEFAULT 0,
  target_word_count INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  type TEXT DEFAULT 'chapter' CHECK (type IN ('chapter', 'scene', 'character-sheet', 'notes')),
  order_index INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  background TEXT,
  personality TEXT,
  goals TEXT,
  conflicts TEXT,
  arc TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create character_relationships table
CREATE TABLE IF NOT EXISTS character_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  related_character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table (story locations/environments)
CREATE TABLE IF NOT EXISTS story_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  atmosphere TEXT,
  significance TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timeline_events table
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT, -- Flexible date format for story timelines
  event_type TEXT DEFAULT 'plot-point' CHECK (event_type IN ('plot-point', 'character-development', 'world-building', 'conflict')),
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  characters_involved TEXT[], -- Array of character names
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scene_cards table
CREATE TABLE IF NOT EXISTS scene_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  purpose TEXT,
  conflict TEXT,
  outcome TEXT,
  characters_present TEXT[],
  setting TEXT,
  act INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_members table (for collaboration)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'writer', 'editor', 'agent', 'viewer')),
  permissions TEXT[],
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position_start INTEGER,
  position_end INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  change_type TEXT DEFAULT 'edit' CHECK (change_type IN ('create', 'edit', 'delete', 'restore')),
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_usage table
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  request_type TEXT NOT NULL,
  cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create watermark_configs table
CREATE TABLE IF NOT EXISTS watermark_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  opacity DECIMAL DEFAULT 0.3,
  position TEXT DEFAULT 'center' CHECK (position IN ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')),
  font_size INTEGER DEFAULT 12,
  is_active BOOLEAN DEFAULT FALSE,
  tier_required TEXT DEFAULT 'free' CHECK (tier_required IN ('free', 'premium', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ab_experiments table
CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT,
  feature TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  traffic_allocation INTEGER DEFAULT 50 CHECK (traffic_allocation BETWEEN 0 AND 100),
  variants JSONB NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ab_assignments table
CREATE TABLE IF NOT EXISTS ab_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(experiment_id, user_id)
);

-- Create ab_events table
CREATE TABLE IF NOT EXISTS ab_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create influencer_partners table
CREATE TABLE IF NOT EXISTS influencer_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  commission_rate DECIMAL DEFAULT 0.20 CHECK (commission_rate BETWEEN 0 AND 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  total_referrals INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  payout_method TEXT DEFAULT 'stripe' CHECK (payout_method IN ('stripe', 'paypal', 'bank')),
  payout_details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES influencer_partners(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  commission_rate DECIMAL, -- Override partner rate if specified
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_conversions table
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES influencer_partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('signup', 'subscription', 'purchase')),
  value_cents INTEGER DEFAULT 0,
  commission_cents INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  encryption_enabled BOOLEAN DEFAULT TRUE,
  encryption_level TEXT DEFAULT 'AES-256-GCM',
  storage_region TEXT DEFAULT 'US',
  watermarking_enabled BOOLEAN DEFAULT TRUE,
  watermark_type TEXT DEFAULT 'invisible' CHECK (watermark_type IN ('visible', 'invisible', 'digital')),
  audit_logging_enabled BOOLEAN DEFAULT TRUE,
  two_factor_required BOOLEAN DEFAULT FALSE,
  auto_backup_enabled BOOLEAN DEFAULT TRUE,
  retention_period INTEGER DEFAULT 365,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create intellectual_properties table
CREATE TABLE IF NOT EXISTS intellectual_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  copyright_claimant TEXT NOT NULL,
  work_title TEXT NOT NULL,
  work_type TEXT DEFAULT 'literary' CHECK (work_type IN ('literary', 'musical', 'dramatic', 'artistic')),
  creation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  rights_statement TEXT NOT NULL,
  digital_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ip_witnesses table
CREATE TABLE IF NOT EXISTS ip_witnesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intellectual_property_id UUID REFERENCES intellectual_properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  signature TEXT,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create compliance_reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('gdpr', 'ccpa', 'dmca', 'coppa')),
  generated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  report_data JSONB NOT NULL,
  file_path TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create export_history table
CREATE TABLE IF NOT EXISTS export_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'txt', 'epub', 'html')),
  watermarked BOOLEAN DEFAULT FALSE,
  file_path TEXT,
  file_size INTEGER,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_characters_project_id ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_story_settings_project_id ON story_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_project_id ON timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_scene_cards_project_id ON scene_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment_id ON ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user_id ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_events_experiment_id ON ab_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_partner_id ON referral_conversions(partner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intellectual_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- User profiles: users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects: users can only see projects they own or are members of
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM project_members
      WHERE project_id = projects.id
    )
  );

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project owners can update projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Project owners can delete projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Documents: users can access documents from projects they have access to
CREATE POLICY "Users can view project documents" ON documents
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid() OR id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create documents in their projects" ON documents
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid() OR id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'writer')
      )
    )
  );

CREATE POLICY "Users can update documents in their projects" ON documents
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = auth.uid() OR id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'writer', 'editor')
      )
    )
  );

-- Similar policies for other tables...
-- (Character, settings, timeline events, etc. follow the same pattern)

-- AI Usage: users can only see their own usage
CREATE POLICY "Users can view own AI usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert AI usage" ON ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Export history: users can only see their own exports
CREATE POLICY "Users can view own export history" ON export_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert export records" ON export_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions

-- Function to update project word count when documents change
CREATE OR REPLACE FUNCTION update_project_word_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET
    word_count = (
      SELECT COALESCE(SUM(word_count), 0)
      FROM documents
      WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for word count updates
CREATE TRIGGER trigger_update_project_word_count
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_project_word_count();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_details TEXT DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_document_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
  user_name TEXT;
BEGIN
  -- Get user name
  SELECT full_name INTO user_name
  FROM user_profiles
  WHERE id = p_user_id;

  INSERT INTO audit_logs (
    user_id,
    user_name,
    action,
    details,
    project_id,
    document_id,
    metadata
  ) VALUES (
    p_user_id,
    user_name,
    p_action,
    p_details,
    p_project_id,
    p_document_id,
    p_metadata
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to track document version
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content actually changed
  IF TG_OP = 'UPDATE' AND OLD.content = NEW.content THEN
    RETURN NEW;
  END IF;

  INSERT INTO document_versions (
    document_id,
    content,
    title,
    author_id,
    change_type,
    summary
  ) VALUES (
    NEW.id,
    OLD.content,
    OLD.title,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'edit' END,
    'Auto-generated version'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document versioning
CREATE TRIGGER trigger_create_document_version
  AFTER INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert some default data

-- Insert default watermark configs
INSERT INTO watermark_configs (name, text, tier_required, is_active) VALUES
('Free Tier Watermark', 'Created with OttoWrite - Upgrade for watermark-free exports', 'free', true),
('Premium Promotion', 'Powered by OttoWrite AI', 'premium', false);

-- Insert default A/B experiments
INSERT INTO ab_experiments (name, description, feature, status, variants) VALUES
('Pricing Page CTA', 'Test different call-to-action buttons on pricing page', 'pricing', 'running',
'{"control": {"text": "Start Free Trial", "color": "blue"}, "variant": {"text": "Get Started Now", "color": "green"}}'),
('Watermark Message', 'Test different watermark messages for conversion', 'watermark', 'running',
'{"control": {"message": "Created with OttoWrite"}, "variant": {"message": "Upgrade to remove watermark"}}');

-- Comments
COMMENT ON DATABASE postgres IS 'OttoWrite AI Canvas - Creative Writing Platform Database';
COMMENT ON TABLE user_profiles IS 'User account information and subscription details';
COMMENT ON TABLE projects IS 'Creative writing projects (novels, screenplays, etc.)';
COMMENT ON TABLE documents IS 'Individual documents/chapters within projects';
COMMENT ON TABLE characters IS 'Character profiles and development';
COMMENT ON TABLE ai_usage IS 'Tracking AI API usage for billing and limits';
COMMENT ON TABLE ab_experiments IS 'A/B testing experiments for platform optimization';