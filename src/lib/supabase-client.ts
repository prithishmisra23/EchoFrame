import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseSettings {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export const DEFAULT_SUPABASE_SETTINGS: SupabaseSettings = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  enabled: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(settings?: SupabaseSettings): SupabaseClient | null {
  const currentSettings = settings || DEFAULT_SUPABASE_SETTINGS;
  if (!currentSettings.url || !currentSettings.anonKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(currentSettings.url, currentSettings.anonKey);
  }
  return cachedClient;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  if (!url || !key) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are required.'
    };
  }

  try {
    const client = createClient(url, key);
    const { error } = await client.from('agents').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "agents" does not exist')) {
      return {
        success: false,
        message: `Connection test error: ${error.message}`
      };
    }
    return {
      success: true,
      message: 'Supabase credentials verified successfully!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect: ${err.message}`
    };
  }
}

export const ECHOFRAME_SUPABASE_SQL_SCHEMA = `-- ==========================================
-- EchoFrame Multi-Agent Database Schema
-- Run in Supabase SQL Editor to provision tables
-- ==========================================

-- 1. Projects Table (Events & Podcasts)
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('event', 'podcast')),
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  location_or_platform TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  assigned_agent_ids TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}'::jsonb,
  speakers JSONB DEFAULT '[]'::jsonb,
  guests JSONB DEFAULT '[]'::jsonb,
  agenda JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agents Table
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('event', 'podcast', 'shared')),
  title TEXT NOT NULL,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  autonomy_level TEXT NOT NULL DEFAULT 'require_approval',
  voice_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  system_prompt TEXT NOT NULL,
  tools JSONB DEFAULT '[]'::jsonb,
  knowledge_docs JSONB DEFAULT '[]'::jsonb,
  bolna_agent_id TEXT,
  bolna_synced BOOLEAN DEFAULT false,
  total_calls_completed INT DEFAULT 0,
  total_tasks_resolved INT DEFAULT 0,
  assigned_project_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks & Workflows Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  project_title TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT,
  rejection_reason TEXT,
  action_payload JSONB,
  execution_log JSONB DEFAULT '[]'::jsonb,
  bolna_execution_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Activity Logs Table (Live Telemetry)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  agent_name TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  domain TEXT NOT NULL,
  project_id TEXT,
  project_title TEXT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo authenticated/anon
CREATE POLICY "Public read/write projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write agents" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
`;
