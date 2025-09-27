# Supabase Database Setup for Ottowrite AI Canvas

This document contains the SQL commands needed to set up your Supabase database for the Ottowrite AI Canvas application.

## Prerequisites

1. Create a Supabase project
2. Copy your project URL and anon key to `.env.local`
3. Get your service role key and add it to `.env.local`

## Database Tables

Run these SQL commands in your Supabase SQL editor:

### 1. User Profiles Table

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'enterprise')),
  usage_count INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2. Projects Table

```sql
-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT DEFAULT 'General',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);
```

### 3. Documents Table

```sql
-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view documents in their projects" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documents.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents in their projects" ON documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documents.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in their projects" ON documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documents.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents in their projects" ON documents
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = documents.project_id
      AND projects.owner_id = auth.uid()
    )
  );
```

### 4. AI Usage Tracking Table

```sql
-- Create ai_usage table
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_provider TEXT NOT NULL CHECK (api_provider IN ('openai', 'anthropic', 'deepseek')),
  tokens_used INTEGER NOT NULL,
  request_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own usage" ON ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage" ON ai_usage
  FOR INSERT WITH CHECK (true); -- Allow service role to insert

-- Create index for performance
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at);
CREATE INDEX idx_ai_usage_provider ON ai_usage(api_provider);
```

### 5. Characters Table

```sql
-- Create characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  traits TEXT[] DEFAULT '{}',
  background TEXT DEFAULT '',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view characters in their projects" ON characters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = characters.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage characters in their projects" ON characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = characters.project_id
      AND projects.owner_id = auth.uid()
    )
  );
```

### 6. Settings Table

```sql
-- Create story_settings table
CREATE TABLE story_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  atmosphere TEXT DEFAULT '',
  details TEXT[] DEFAULT '{}',
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE story_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view settings in their projects" ON story_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = story_settings.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage settings in their projects" ON story_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = story_settings.project_id
      AND projects.owner_id = auth.uid()
    )
  );
```

### 7. User Tier Changes Log

```sql
-- Create user_tier_changes table for audit trail
CREATE TABLE user_tier_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tier TEXT NOT NULL,
  to_tier TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_tier_changes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own tier changes" ON user_tier_changes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert tier changes" ON user_tier_changes
  FOR INSERT WITH CHECK (true);
```

### 8. Story Analysis Table

```sql
-- Create story_analysis table
CREATE TABLE story_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  overall_score INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE story_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view analysis for their documents" ON story_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      JOIN projects ON projects.id = documents.project_id
      WHERE documents.id = story_analysis.document_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create analysis for their documents" ON story_analysis
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      JOIN projects ON projects.id = documents.project_id
      WHERE documents.id = story_analysis.document_id
      AND projects.owner_id = auth.uid()
    )
  );
```

## Indexes for Performance

```sql
-- Additional indexes for better performance
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_characters_project ON characters(project_id);
CREATE INDEX idx_story_settings_project ON story_settings(project_id);
CREATE INDEX idx_story_analysis_document ON story_analysis(document_id);
```

## Functions for Usage Tracking

```sql
-- Function to get monthly usage
CREATE OR REPLACE FUNCTION get_monthly_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(tokens_used), 0)
  INTO usage_count
  FROM ai_usage
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', NOW());

  RETURN usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  usage_limit INTEGER;
  current_usage INTEGER;
BEGIN
  -- Get user tier and limit
  SELECT tier, usage_limit
  INTO user_tier, usage_limit
  FROM user_profiles
  WHERE id = p_user_id;

  -- Enterprise users have unlimited usage
  IF user_tier = 'enterprise' THEN
    RETURN TRUE;
  END IF;

  -- Get current month usage
  current_usage := get_monthly_usage(p_user_id);

  RETURN current_usage < usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Initial Data

```sql
-- Insert sample data (optional)
INSERT INTO projects (title, description, genre, owner_id) VALUES
('Sample Project', 'A demo project to get started', 'Fantasy', auth.uid())
ON CONFLICT DO NOTHING;
```

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
DEEPSEEK_API_KEY=your_deepseek_key
```

After running these commands, your Supabase database will be ready to support all the AI-powered features of Ottowrite AI Canvas.