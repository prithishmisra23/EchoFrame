-- ==============================================================================
-- EchoFrame — Supabase Migration: 001_echoframe_schema.sql
-- Multi-Agent Voice AI Operations Schema for Events & Podcasts
-- ==============================================================================

-- 1. Projects (Events & Podcasts)
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

-- 2. Agents (Specialized Voice AI Roles)
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

-- 3. Tasks with Lifecycle States & Dependencies
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  project_title TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_agent_id TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'backlog',
  lifecycle_state TEXT NOT NULL DEFAULT 'planned' CHECK (lifecycle_state IN ('planned', 'awaiting_approval', 'queued', 'executing', 'succeeded', 'failed')),
  depends_on TEXT[] DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'medium',
  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT,
  rejection_reason TEXT,
  action_payload JSONB,
  execution_log JSONB DEFAULT '[]'::jsonb,
  bolna_execution_id TEXT,
  provider TEXT DEFAULT 'bolna',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Activity Logs (Real-time Telemetry Stream)
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

-- 5. Execution Records (Bolna Telephony / Sandbox Audits)
CREATE TABLE IF NOT EXISTS public.executions (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  agent_id TEXT,
  provider TEXT NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL,
  duration_seconds INT DEFAULT 0,
  transcript JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  sentiment TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;

-- Development access policies (allow authenticated and anon for demo dashboard)
DROP POLICY IF EXISTS "EchoFrame public projects access" ON public.projects;
CREATE POLICY "EchoFrame public projects access" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "EchoFrame public agents access" ON public.agents;
CREATE POLICY "EchoFrame public agents access" ON public.agents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "EchoFrame public tasks access" ON public.tasks;
CREATE POLICY "EchoFrame public tasks access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "EchoFrame public logs access" ON public.activity_logs;
CREATE POLICY "EchoFrame public logs access" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "EchoFrame public executions access" ON public.executions;
CREATE POLICY "EchoFrame public executions access" ON public.executions FOR ALL USING (true) WITH CHECK (true);
