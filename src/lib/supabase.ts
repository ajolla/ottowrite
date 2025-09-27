import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  tier: 'free' | 'premium' | 'enterprise';
  usage_count: number;
  usage_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  project_id: string;
  created_at: string;
  updated_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  api_provider: 'openai' | 'anthropic' | 'deepseek';
  tokens_used: number;
  request_type: string;
  created_at: string;
}