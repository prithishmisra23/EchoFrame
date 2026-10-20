import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, Agent, Task, ActivityLogItem, BolnaExecutionResult } from '@/lib/types';

export interface DbStatus {
  configured: boolean;
  url?: string;
  mode: 'supabase_cloud' | 'local_storage_labelled';
}

export function getSupabaseServerClient(): { client: SupabaseClient | null; status: DbStatus } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    return {
      client: null,
      status: {
        configured: false,
        mode: 'local_storage_labelled',
      },
    };
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });
    return {
      client,
      status: {
        configured: true,
        url,
        mode: 'supabase_cloud',
      },
    };
  } catch (err) {
    console.warn('Failed to initialize Supabase server client:', err);
    return {
      client: null,
      status: {
        configured: false,
        mode: 'local_storage_labelled',
      },
    };
  }
}

export async function persistProjectToDb(project: Project): Promise<{ savedToCloud: boolean }> {
  const { client, status } = getSupabaseServerClient();
  if (!client || !status.configured) {
    return { savedToCloud: false };
  }

  try {
    const { error } = await client.from('projects').upsert({
      id: project.id,
      type: project.type,
      title: project.title,
      description: project.description,
      date: project.date,
      location_or_platform: project.locationOrPlatform,
      status: project.status,
      assigned_agent_ids: project.assignedAgentIds,
      metrics: project.metrics,
      speakers: project.speakers || [],
      guests: project.guests || [],
      agenda: project.agenda || [],
      tags: project.tags,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('Supabase project upsert error:', error.message);
      return { savedToCloud: false };
    }
    return { savedToCloud: true };
  } catch (err) {
    console.warn('Supabase project persist exception:', err);
    return { savedToCloud: false };
  }
}

export async function persistTaskToDb(task: Task): Promise<{ savedToCloud: boolean }> {
  const { client, status } = getSupabaseServerClient();
  if (!client || !status.configured) {
    return { savedToCloud: false };
  }

  try {
    const { error } = await client.from('tasks').upsert({
      id: task.id,
      project_id: task.projectId,
      project_title: task.projectTitle,
      title: task.title,
      description: task.description,
      assigned_agent_id: task.assignedAgentId,
      status: task.status,
      lifecycle_state: task.lifecycleState || (task.status === 'awaiting_approval' ? 'awaiting_approval' : task.status === 'completed' ? 'succeeded' : 'planned'),
      depends_on: task.dependsOn || [],
      priority: task.priority,
      requires_approval: task.requiresApproval,
      approval_status: task.approvalStatus,
      rejection_reason: task.rejectionReason,
      action_payload: task.actionPayload,
      execution_log: task.executionLog,
      bolna_execution_id: task.bolnaExecutionId,
      provider: task.provider || 'bolna',
      result: task.result,
      error: task.error,
      completed_at: task.completedAt ? new Date().toISOString() : null,
    });

    if (error) {
      console.warn('Supabase task upsert error:', error.message);
      return { savedToCloud: false };
    }
    return { savedToCloud: true };
  } catch (err) {
    console.warn('Supabase task persist exception:', err);
    return { savedToCloud: false };
  }
}

export async function persistExecutionToDb(
  taskId: string,
  execution: BolnaExecutionResult
): Promise<{ savedToCloud: boolean }> {
  const { client, status } = getSupabaseServerClient();
  if (!client || !status.configured) {
    return { savedToCloud: false };
  }

  try {
    const { error } = await client.from('executions').insert({
      id: execution.execution_id,
      task_id: taskId,
      agent_id: execution.agent_id,
      provider: execution.provider || (execution.is_sandbox ? 'bolna_sandbox' : 'bolna_cloud'),
      is_sandbox: Boolean(execution.is_sandbox),
      status: execution.status,
      duration_seconds: execution.call_duration_seconds,
      transcript: execution.transcript,
      summary: execution.summary,
      sentiment: execution.sentiment,
      error: execution.error,
    });

    if (error) {
      console.warn('Supabase execution insert error:', error.message);
      return { savedToCloud: false };
    }
    return { savedToCloud: true };
  } catch (err) {
    console.warn('Supabase execution persist exception:', err);
    return { savedToCloud: false };
  }
}
