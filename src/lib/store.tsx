'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Agent,
  Project,
  Task,
  ActivityLogItem,
  WorkflowPlan,
  BolnaCallPayload,
  BolnaExecutionResult,
  TaskStatus,
  EventBrief,
  ConversationMessage,
  ConversationPhase,
  EventAttendee,
} from './types';
import { INITIAL_AGENTS, INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_ACTIVITY_LOGS } from './initial-data';
import { BolnaSettings, DEFAULT_BOLNA_SETTINGS, bolnaService } from './bolna-client';
import { SupabaseSettings, DEFAULT_SUPABASE_SETTINGS } from './supabase-client';
import confetti from 'canvas-confetti';

export type EchoFrameTab = 'operator' | 'dashboard' | 'agents' | 'command' | 'operations' | 'projects' | 'stage-host' | 'attendees' | 'settings';

interface EchoFrameContextType {
  agents: Agent[];
  projects: Project[];
  tasks: Task[];
  activityLogs: ActivityLogItem[];
  bolnaSettings: BolnaSettings;
  supabaseSettings: SupabaseSettings;
  activeTab: EchoFrameTab;
  selectedProjectId: string | null;
  activeApprovalTask: Task | null;
  activeExecutionResult: BolnaExecutionResult | null;
  isExecutingWorkflow: boolean;

  // Event Operator Conversation State
  eventBrief: Partial<EventBrief> | null;
  conversationMessages: ConversationMessage[];
  conversationPhase: ConversationPhase;

  // Attendee & Personal AI State
  activeAttendeeId: string | null;

  // Actions
  setActiveTab: (tab: EchoFrameTab) => void;
  setSelectedProjectId: (id: string | null) => void;
  setActiveApprovalTask: (task: Task | null) => void;
  setActiveExecutionResult: (res: BolnaExecutionResult | null) => void;
  setActiveAttendeeId: (id: string | null) => void;
  addAttendee: (projectId: string, attendeeData: Omit<EventAttendee, 'id' | 'badgeCode'>) => EventAttendee;
  updateAttendee: (projectId: string, attendee: EventAttendee) => void;
  deleteAttendee: (projectId: string, attendeeId: string) => void;
  setEventBrief: (brief: Partial<EventBrief> | null) => void;
  updateEventBrief: (updates: Partial<EventBrief>) => void;
  setConversationMessages: (msgs: ConversationMessage[] | ((prev: ConversationMessage[]) => ConversationMessage[])) => void;
  addConversationMessage: (msg: ConversationMessage) => void;
  setConversationPhase: (phase: ConversationPhase) => void;
  launchEventFromBrief: (brief: EventBrief, proposedTasks?: any[], agentSuggestions?: any[]) => Promise<Project>;
  updateAgent: (agent: Agent) => void;
  createAgent: (agentData: Partial<Agent>) => Agent;
  createProject: (projectData: Partial<Project>) => Project;
  updateProject: (project: Project) => void;
  createTask: (taskData: Partial<Task>) => Task;
  updateTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  approveTask: (taskId: string, comments?: string, customTask?: Task) => Promise<void>;
  rejectTask: (taskId: string, reason: string) => void;
  addActivityLog: (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;
  executeWorkflowPlan: (plan: WorkflowPlan, createdProject?: Project | null) => Promise<void>;
  triggerBolnaCall: (taskId: string | null, payload: BolnaCallPayload, agentName?: string) => Promise<BolnaExecutionResult>;
  saveBolnaSettings: (settings: Partial<BolnaSettings>) => void;
  saveSupabaseSettings: (settings: Partial<SupabaseSettings>) => void;
  resetToDefaultData: () => void;
}

const EchoFrameContext = createContext<EchoFrameContextType | undefined>(undefined);

export function EchoFrameProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOGS);
  const [bolnaSettings, setBolnaSettingsState] = useState<BolnaSettings>(DEFAULT_BOLNA_SETTINGS);
  const [supabaseSettings, setSupabaseSettingsState] = useState<SupabaseSettings>(DEFAULT_SUPABASE_SETTINGS);
  const [activeTab, setActiveTab] = useState<EchoFrameTab>('operator');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('proj-bharat-2026');
  const [activeApprovalTask, setActiveApprovalTask] = useState<Task | null>(null);
  const [activeExecutionResult, setActiveExecutionResult] = useState<BolnaExecutionResult | null>(null);
  const [activeAttendeeId, setActiveAttendeeId] = useState<string | null>('att-1');
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Event Operator conversation state
  const [eventBrief, setEventBrief] = useState<Partial<EventBrief> | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>('initial');

  const updateEventBrief = useCallback((updates: Partial<EventBrief>) => {
    setEventBrief((prev) => ({
      ...(prev || {}),
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addConversationMessage = useCallback((msg: ConversationMessage) => {
    setConversationMessages((prev) => [...prev, msg]);
  }, []);

  // Hydrate from localStorage once on client and merge Think for Bharat 1.0
  useEffect(() => {
    try {
      const storedAgents = localStorage.getItem('echoframe_agents');
      const storedProjects = localStorage.getItem('echoframe_projects');
      const storedTasks = localStorage.getItem('echoframe_tasks');
      const storedLogs = localStorage.getItem('echoframe_logs');
      const storedBolna = localStorage.getItem('echoframe_bolna');
      const storedSupabase = localStorage.getItem('echoframe_supabase');

      if (storedAgents) setAgents(JSON.parse(storedAgents));

      if (storedProjects) {
        const parsedProjects: Project[] = JSON.parse(storedProjects);
        // Ensure Think for Bharat 1.0 is present with up-to-date attendees and venue data
        const bharatIndex = parsedProjects.findIndex((p) => p.id === 'proj-bharat-2026');
        const defaultBharat = INITIAL_PROJECTS.find((p) => p.id === 'proj-bharat-2026')!;
        if (bharatIndex === -1) {
          parsedProjects.unshift(defaultBharat);
        } else {
          // Merge missing attendees or venue details
          if (!parsedProjects[bharatIndex].attendees || parsedProjects[bharatIndex].attendees?.length === 0) {
            parsedProjects[bharatIndex].attendees = defaultBharat.attendees;
          }
          if (!parsedProjects[bharatIndex].venueDetails) {
            parsedProjects[bharatIndex].venueDetails = defaultBharat.venueDetails;
          }
          if (!parsedProjects[bharatIndex].faqs) {
            parsedProjects[bharatIndex].faqs = defaultBharat.faqs;
          }
        }
        setProjects(parsedProjects);
      } else {
        setProjects(INITIAL_PROJECTS);
      }

      if (storedTasks) {
        const parsedTasks: Task[] = JSON.parse(storedTasks);
        const hasTbTasks = parsedTasks.some((t) => t.id && t.id.startsWith('task-tb-'));
        if (!hasTbTasks) {
          const tbTasks = INITIAL_TASKS.filter((t) => t.id && t.id.startsWith('task-tb-'));
          parsedTasks.unshift(...tbTasks);
        }
        setTasks(parsedTasks);
      } else {
        setTasks(INITIAL_TASKS);
      }

      if (storedLogs) setActivityLogs(JSON.parse(storedLogs));
      if (storedBolna) {
        const parsed = JSON.parse(storedBolna);
        setBolnaSettingsState(parsed);
        bolnaService.updateSettings(parsed);
      }
      if (storedSupabase) setSupabaseSettingsState(JSON.parse(storedSupabase));
    } catch (e) {
      console.warn('LocalStorage hydration error, using initial defaults:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('echoframe_agents', JSON.stringify(agents));
      localStorage.setItem('echoframe_projects', JSON.stringify(projects));
      localStorage.setItem('echoframe_tasks', JSON.stringify(tasks));
      localStorage.setItem('echoframe_logs', JSON.stringify(activityLogs));
      localStorage.setItem('echoframe_bolna', JSON.stringify(bolnaSettings));
      localStorage.setItem('echoframe_supabase', JSON.stringify(supabaseSettings));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [agents, projects, tasks, activityLogs, bolnaSettings, supabaseSettings, isHydrated]);

  const addActivityLog = useCallback((item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => {
    const newLog: ActivityLogItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  }, []);

  const updateAgent = useCallback((updatedAgent: Agent) => {
    setAgents((prev) => prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)));
    addActivityLog({
      agentId: updatedAgent.id,
      agentName: updatedAgent.name,
      agentRole: updatedAgent.role,
      domain: updatedAgent.domain,
      type: 'agent_sync',
      message: `Agent ${updatedAgent.name} configuration updated (Voice: ${updatedAgent.voiceConfig.voiceName}, Autonomy: ${updatedAgent.autonomyLevel}).`,
    });
  }, [addActivityLog]);

  const createAgent = useCallback((agentData: Partial<Agent>): Agent => {
    const newId = `agent-${Date.now().toString(36)}`;
    const newAgent: Agent = {
      id: newId,
      name: agentData.name || 'New Specialized Agent',
      role: agentData.role || 'custom',
      domain: agentData.domain || 'shared',
      title: agentData.title || 'AI Specialist',
      avatar: agentData.avatar || '🤖',
      status: 'idle',
      autonomyLevel: agentData.autonomyLevel || 'require_approval',
      voiceConfig: agentData.voiceConfig || {
        provider: 'bolna',
        voiceId: 'bolna-default',
        voiceName: 'Bolna Natural',
        pitch: 1.0,
        speed: 1.0,
        temperature: 0.3,
      },
      systemPrompt: agentData.systemPrompt || 'You are an EchoFrame specialized agent.',
      tools: agentData.tools || [],
      knowledgeDocs: agentData.knowledgeDocs || [],
      bolnaAgentId: agentData.bolnaAgentId || `bolna_${newId}`,
      bolnaSynced: true,
      totalCallsCompleted: 0,
      totalTasksResolved: 0,
      assignedProjectIds: agentData.assignedProjectIds || [],
    };

    setAgents((prev) => [newAgent, ...prev]);
    addActivityLog({
      agentId: newAgent.id,
      agentName: newAgent.name,
      agentRole: newAgent.role,
      domain: newAgent.domain,
      type: 'agent_sync',
      message: `New agent ${newAgent.name} provisioned in Agent Studio.`,
    });
    return newAgent;
  }, [addActivityLog]);

  const createProject = useCallback((projectData: Partial<Project>): Project => {
    const newId = `proj-${Date.now().toString(36)}`;
    const newProject: Project = {
      id: newId,
      type: projectData.type || 'event',
      title: projectData.title || 'New Untitled Project',
      description: projectData.description || '',
      date: projectData.date || 'TBD',
      locationOrPlatform: projectData.locationOrPlatform || 'Main Stage / Studio',
      status: 'planning',
      assignedAgentIds: projectData.assignedAgentIds || [],
      metrics: {
        progressPercent: 10,
        tasksTotal: 1,
        tasksCompleted: 0,
        speakersOrGuestsCount: (projectData.speakers?.length || projectData.guests?.length || 0),
        registeredAttendeesCount: projectData.type === 'event' ? 50 : undefined,
        callsMadeCount: 0,
      },
      speakers: projectData.speakers || [],
      guests: projectData.guests || [],
      agenda: projectData.agenda || [],
      tags: projectData.tags || ['General'],
    };

    setProjects((prev) => [newProject, ...prev]);
    addActivityLog({
      agentId: 'system',
      agentName: 'EchoFrame Orchestrator',
      agentRole: 'scheduling_agenda',
      domain: newProject.type,
      projectId: newProject.id,
      projectTitle: newProject.title,
      type: 'task_created',
      message: `Created new ${newProject.type.toUpperCase()}: "${newProject.title}".`,
    });
    return newProject;
  }, [addActivityLog]);

  const updateProject = useCallback((updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const addAttendee = useCallback((projectId: string, attendeeData: Omit<EventAttendee, 'id' | 'badgeCode'>): EventAttendee => {
    const newId = `att-${Date.now()}`;
    const badgeCode = `TB-${attendeeData.role.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newAttendee: EventAttendee = {
      ...attendeeData,
      id: newId,
      badgeCode,
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        const existingAttendees = proj.attendees || [];
        return {
          ...proj,
          attendees: [newAttendee, ...existingAttendees],
          metrics: {
            ...proj.metrics,
            registeredAttendeesCount: (proj.metrics.registeredAttendeesCount || 0) + 1,
          },
        };
      })
    );

    addActivityLog({
      agentId: 'agent-atlas',
      agentName: 'Atlas Reid',
      agentRole: 'attendee_support',
      domain: 'event',
      projectId,
      projectTitle: 'Think for Bharat 1.0',
      type: 'task_created',
      message: `Registered new attendee: ${newAttendee.name} (${newAttendee.role.toUpperCase()}) with badge ${newAttendee.badgeCode}. Personal AI companion activated.`,
    });

    return newAttendee;
  }, [addActivityLog]);

  const updateAttendee = useCallback((projectId: string, updatedAttendee: EventAttendee) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          attendees: (proj.attendees || []).map((att) =>
            att.id === updatedAttendee.id ? updatedAttendee : att
          ),
        };
      })
    );
  }, []);

  const deleteAttendee = useCallback((projectId: string, attendeeId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          attendees: (proj.attendees || []).filter((att) => att.id !== attendeeId),
          metrics: {
            ...proj.metrics,
            registeredAttendeesCount: Math.max(0, (proj.metrics.registeredAttendeesCount || 1) - 1),
          },
        };
      })
    );
  }, []);

  const createTask = useCallback((taskData: Partial<Task>): Task => {
    const newId = `task-${Date.now().toString(36)}`;
    const assignedAgent = agents.find((a) => a.id === taskData.assignedAgentId) || agents[0];
    const project = projects.find((p) => p.id === taskData.projectId) || projects[0];

    const newTask: Task = {
      id: newId,
      projectId: project.id,
      projectTitle: project.title,
      title: taskData.title || 'Autonomous Action Task',
      description: taskData.description || '',
      assignedAgentId: assignedAgent.id,
      status: taskData.status || (taskData.requiresApproval ? 'awaiting_approval' : 'in_progress'),
      priority: taskData.priority || 'medium',
      createdAt: 'Just now',
      requiresApproval: taskData.requiresApproval ?? false,
      approvalStatus: taskData.requiresApproval ? 'pending' : undefined,
      actionPayload: taskData.actionPayload,
      executionLog: [
        { timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: `Task initialized and assigned to ${assignedAgent.name}.`, level: 'info' }
      ],
      bolnaExecutionId: taskData.bolnaExecutionId,
    };

    setTasks((prev) => [newTask, ...prev]);
    addActivityLog({
      agentId: assignedAgent.id,
      agentName: assignedAgent.name,
      agentRole: assignedAgent.role,
      domain: assignedAgent.domain,
      projectId: project.id,
      projectTitle: project.title,
      type: taskData.requiresApproval ? 'approval_requested' : 'task_created',
      message: taskData.requiresApproval
        ? `Approval requested: "${newTask.title}" for ${assignedAgent.name}`
        : `New task assigned to ${assignedAgent.name}: "${newTask.title}"`,
    });
    return newTask;
  }, [agents, projects, addActivityLog]);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newLog = [...t.executionLog, { timestamp: now, message: `Status updated to ${status}.`, level: 'info' as const }];
        return {
          ...t,
          status,
          completedAt: status === 'completed' ? 'Just now' : t.completedAt,
          executionLog: newLog,
        };
      })
    );
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  }, []);

  const triggerBolnaCall = useCallback(
    async (taskId: string | null, payload: BolnaCallPayload, agentName = 'Agent'): Promise<BolnaExecutionResult> => {
      // Find agent
      const agent = agents.find((a) => a.id === payload.agent_id) || agents[0];

      // Mark agent as in_call
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: 'in_call' } : a))
      );

      addActivityLog({
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
        domain: agent.domain,
        type: 'call_started',
        message: `Dispatching Bolna voice call to ${payload.recipient_phone_number} (${payload.recipient_name || 'Speaker/Guest'}).`,
      });

      // Execute via Bolna service
      const result = await bolnaService.triggerCall(payload, agent.name);

      // Restore agent status and increment metrics
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id
            ? {
                ...a,
                status: 'active',
                totalCallsCompleted: a.totalCallsCompleted + 1,
              }
            : a
        )
      );

      // If associated with a task, update task
      if (taskId) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== taskId) return t;
            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return {
              ...t,
              status: 'completed',
              completedAt: 'Just now',
              bolnaExecutionId: result.execution_id,
              executionLog: [
                ...t.executionLog,
                { timestamp: now, message: `Bolna call successfully executed. ID: ${result.execution_id}. Duration: ${result.call_duration_seconds}s.`, level: 'success' },
              ],
            };
          })
        );
      }

      addActivityLog({
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
        domain: agent.domain,
        type: 'call_completed',
        message: `Bolna call completed with ${payload.recipient_name || payload.recipient_phone_number}. Sentiment: ${result.sentiment || 'positive'}.`,
        details: result.summary,
      });

      setActiveExecutionResult(result);
      return result;
    },
    [agents, addActivityLog]
  );

  const approveTask = useCallback(
    async (taskId: string, comments?: string, customTask?: Task) => {
      const task = customTask || tasks.find((t) => t.id === taskId);
      if (!task) return;

      const agent = agents.find((a) => a.id === task.assignedAgentId);

      try {
        const res = await fetch('/api/tasks/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task,
            allTasks: tasks,
            supervisorComments: comments,
            overrideApiKey: bolnaSettings.apiKey || undefined,
            overrideSandbox: bolnaSettings.sandboxMode,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          alert(`Authorization Error: ${data.error || 'Server rejected task approval.'}`);
          return;
        }

        const updatedServerTask: Task = data.task;

        // Update task list with the server-verified execution outcome
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === taskId) {
              return updatedServerTask;
            }
            // Check if any blocked tasks were waiting for this prerequisite task
            if (t.dependsOn?.includes(taskId) && t.status === 'backlog') {
              return {
                ...t,
                status: t.requiresApproval ? 'awaiting_approval' : 'in_progress',
                lifecycleState: t.requiresApproval ? 'awaiting_approval' : 'executing',
                executionLog: [
                  ...t.executionLog,
                  {
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    message: `Prerequisite task "${task.title}" succeeded. Task unblocked and queued.`,
                    level: 'info' as const,
                  },
                ],
              };
            }
            return t;
          })
        );

        if (data.execution) {
          setActiveExecutionResult(data.execution);
        }

        // Celebrate approval success
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#10b981', '#059669', '#34d399', '#ffffff'],
          });
        } catch (e) {
          // ignore
        }

        addActivityLog({
          agentId: task.assignedAgentId,
          agentName: agent?.name || 'Agent',
          agentRole: agent?.role || 'custom',
          domain: agent?.domain || 'shared',
          projectId: task.projectId,
          projectTitle: task.projectTitle,
          type: 'approval_granted',
          message: `Approved: "${task.title}". Executed via ${data.isSandbox ? '[SANDBOX]' : '[BOLNA CLOUD]'}.`,
        });

        setActiveApprovalTask(null);
      } catch (err: any) {
        alert(`Network error approving task: ${err.message}`);
      }
    },
    [tasks, agents, bolnaSettings, addActivityLog]
  );

  const rejectTask = useCallback(
    (taskId: string, reason: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const agent = agents.find((a) => a.id === task.assignedAgentId);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            status: 'failed',
            lifecycleState: 'failed',
            approvalStatus: 'rejected',
            rejectionReason: reason,
            executionLog: [
              ...t.executionLog,
              { timestamp: now, message: `Action rejected by human supervisor: "${reason}". Rollback initiated.`, level: 'warning' },
            ],
          };
        })
      );

      addActivityLog({
        agentId: task.assignedAgentId,
        agentName: agent?.name || 'Agent',
        agentRole: agent?.role || 'custom',
        domain: agent?.domain || 'shared',
        projectId: task.projectId,
        projectTitle: task.projectTitle,
        type: 'alert',
        message: `Task rejected: "${task.title}". Reason: ${reason}`,
      });

      setActiveApprovalTask(null);
    },
    [tasks, agents, addActivityLog]
  );

  const executeWorkflowPlan = useCallback(
    async (plan: WorkflowPlan, createdProject?: Project | null) => {
      setIsExecutingWorkflow(true);

      // If a new project was created by the orchestrator, register it in projects list
      if (createdProject && !projects.some((p) => p.id === createdProject.id)) {
        setProjects((prev) => [createdProject, ...prev]);
      }

      addActivityLog({
        agentId: 'system',
        agentName: 'EchoFrame Orchestrator',
        agentRole: 'scheduling_agenda',
        domain: plan.domain,
        projectId: plan.projectId,
        projectTitle: plan.projectTitle,
        type: 'task_created',
        message: `Initiating multi-agent workflow: "${plan.summary}" with ${plan.steps.length} coordinated agent actions.`,
      });

      // Spawn tasks for each step with dependencies and lifecycle states
      for (const step of plan.steps) {
        const agent = agents.find((a) => a.id === step.agentId) || agents[0];
        const isBlockedByPrereq = Boolean(step.dependsOn && step.dependsOn.length > 0);
        
        const taskStatus = step.requiresHumanApproval
          ? 'awaiting_approval'
          : isBlockedByPrereq
          ? 'backlog'
          : 'in_progress';

        const lifecycleState = step.requiresHumanApproval
          ? 'awaiting_approval'
          : isBlockedByPrereq
          ? 'planned'
          : 'executing';

        createTask({
          id: step.id,
          projectId: plan.projectId,
          projectTitle: plan.projectTitle,
          title: step.title,
          description: step.description,
          assignedAgentId: agent.id,
          priority: step.requiresHumanApproval ? 'high' : 'medium',
          requiresApproval: step.requiresHumanApproval,
          status: taskStatus,
          lifecycleState: lifecycleState as any,
          dependsOn: step.dependsOn || [],
          actionPayload: {
            actionType: step.actionType === 'voice_call' ? 'voice_call' : 'database_update',
            recipient: step.actionType === 'voice_call' ? 'Dr. Marcus Vance' : plan.projectTitle,
            phone: step.actionType === 'voice_call' ? '+1 (415) 555-0198' : undefined,
            bolnaAgentId: agent.bolnaAgentId,
            messageContent: step.description,
          },
        });
      }

      setIsExecutingWorkflow(false);
      setActiveTab('operations');
    },
    [agents, projects, createTask, addActivityLog]
  );

  const launchEventFromBrief = useCallback(
    async (brief: EventBrief, proposedTasks?: any[], agentSuggestions?: any[]) => {
      setIsExecutingWorkflow(true);
      const isPodcast = (brief.type || '').toLowerCase().includes('podcast');
      const domain = isPodcast ? 'podcast' : 'event';
      const projectId = `proj-${Date.now().toString(36)}`;
      const projectTitle = brief.name || (domain === 'podcast' ? 'New Podcast Series' : 'New AI Conference 2026');

      // 1. Gather assigned agents
      let assignedAgentIds: string[] = [];
      if (agentSuggestions && agentSuggestions.length > 0) {
        assignedAgentIds = agentSuggestions.map((a: any) => a.agentId).filter(Boolean);
      }
      if (assignedAgentIds.length === 0) {
        assignedAgentIds = agents
          .filter((a) => a.domain === domain || a.domain === 'shared')
          .map((a) => a.id);
      }

      // 2. Create the Project
      const newProject: Project = {
        id: projectId,
        type: domain,
        title: projectTitle,
        description: brief.description || `Event planned via EchoFrame AI Operator. ${brief.expectedAttendance ? `${brief.expectedAttendance} expected attendees.` : ''}`,
        date: brief.date || 'Upcoming 2026',
        locationOrPlatform: brief.venue || (domain === 'podcast' ? 'Studio & Remote Feeds' : 'Main Venue'),
        status: 'active',
        assignedAgentIds,
        metrics: {
          progressPercent: 10,
          tasksTotal: proposedTasks?.length || 4,
          tasksCompleted: 0,
          speakersOrGuestsCount: 2,
          registeredAttendeesCount: brief.expectedAttendance || 500,
          callsMadeCount: 0,
        },
        tags: [domain.toUpperCase(), 'AI Operator', 'EchoFrame Live'],
      };

      setProjects((prev) => [newProject, ...prev]);
      setSelectedProjectId(newProject.id);

      // 3. Create Tasks
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (proposedTasks && proposedTasks.length > 0) {
        for (let i = 0; i < proposedTasks.length; i++) {
          const pt = proposedTasks[i];
          const matchedAgent = agents.find((a) => a.role === pt.agentRole || a.id === pt.agentId) || agents[0];
          const isApproval = pt.requiresApproval ?? (i === 1 || pt.actionType === 'voice_call');

          createTask({
            id: `task-${Date.now()}-${i + 1}`,
            projectId: newProject.id,
            projectTitle: newProject.title,
            title: pt.title,
            description: pt.description,
            priority: i === 0 ? 'high' : 'medium',
            status: isApproval ? 'awaiting_approval' : i === 0 ? 'in_progress' : 'backlog',
            lifecycleState: isApproval ? 'awaiting_approval' : i === 0 ? 'executing' : 'planned',
            assignedAgentId: matchedAgent.id,
            requiresApproval: isApproval,
            actionPayload: {
              actionType: pt.actionType === 'voice_call' ? 'voice_call' : 'database_update',
              recipient: pt.actionType === 'voice_call' ? 'Keynote Coordinator' : projectTitle,
              phone: pt.actionType === 'voice_call' ? '+1 (415) 555-0198' : undefined,
              bolnaAgentId: matchedAgent.bolnaAgentId,
              messageContent: pt.description,
            },
          });
        }
      } else {
        // Fallback default tasks
        const defaultRole1 = domain === 'podcast' ? 'guest_coordination' : 'speaker_coordination';
        const defaultRole2 = domain === 'podcast' ? 'research_briefing' : 'scheduling_agenda';
        const agent1 = agents.find((a) => a.role === defaultRole1) || agents[0];
        const agent2 = agents.find((a) => a.role === defaultRole2) || agents[1] || agents[0];

        createTask({
          id: `task-${Date.now()}-1`,
          projectId: newProject.id,
          projectTitle: newProject.title,
          title: domain === 'podcast' ? 'Conduct Remote Guest Soundcheck Call' : 'Outbound Speaker Confirmation Phone Call',
          description: domain === 'podcast' ? 'Test guest microphone and headphones via Bolna telephony.' : 'Call keynote speakers to confirm stage timing and A/V requirements.',
          priority: 'high',
          status: 'awaiting_approval',
          lifecycleState: 'awaiting_approval',
          assignedAgentId: agent1.id,
          requiresApproval: true,
          actionPayload: {
            actionType: 'voice_call',
            recipient: 'VIP Guest',
            phone: '+1 (415) 555-0198',
            bolnaAgentId: agent1.bolnaAgentId,
            messageContent: 'Speaker confirmation and stage requirements check.',
          },
        });

        createTask({
          id: `task-${Date.now()}-2`,
          projectId: newProject.id,
          projectTitle: newProject.title,
          title: domain === 'podcast' ? 'Assemble Episode Research Dossier' : 'Finalize Master Stage Run-of-Show',
          description: domain === 'podcast' ? 'Generate contrarian questions and background research.' : 'Balance stage drift, intermission buffers, and A/V cues.',
          priority: 'medium',
          status: 'in_progress',
          lifecycleState: 'executing',
          assignedAgentId: agent2.id,
          requiresApproval: false,
        });
      }

      addActivityLog({
        agentId: 'system',
        agentName: 'EchoFrame Operator',
        agentRole: 'scheduling_agenda',
        domain,
        projectId: newProject.id,
        projectTitle: newProject.title,
        type: 'task_created',
        message: `Plan converted to live operations for "${newProject.title}". Agents assigned and tasks queued.`,
      });

      // Celebrate!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
        });
      } catch (e) {
        // ignore
      }

      setIsExecutingWorkflow(false);
      setConversationPhase('executing');
      setActiveTab('operations');
      return newProject;
    },
    [agents, createTask, addActivityLog]
  );

  const saveBolnaSettings = useCallback((newSettings: Partial<BolnaSettings>) => {
    setBolnaSettingsState((prev) => {
      const merged = { ...prev, ...newSettings };
      bolnaService.updateSettings(merged);
      return merged;
    });
  }, []);

  const saveSupabaseSettings = useCallback((newSettings: Partial<SupabaseSettings>) => {
    setSupabaseSettingsState((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetToDefaultData = useCallback(() => {
    setAgents(INITIAL_AGENTS);
    setProjects(INITIAL_PROJECTS);
    setTasks(INITIAL_TASKS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setBolnaSettingsState(DEFAULT_BOLNA_SETTINGS);
    bolnaService.updateSettings(DEFAULT_BOLNA_SETTINGS);
    setSupabaseSettingsState(DEFAULT_SUPABASE_SETTINGS);
    setEventBrief(null);
    setConversationMessages([]);
    setConversationPhase('initial');
    localStorage.clear();
  }, []);

  return (
    <EchoFrameContext.Provider
      value={{
        agents,
        projects,
        tasks,
        activityLogs,
        bolnaSettings,
        supabaseSettings,
        activeTab,
        selectedProjectId,
        activeApprovalTask,
        activeExecutionResult,
        isExecutingWorkflow,
        eventBrief,
        conversationMessages,
        conversationPhase,
        activeAttendeeId,
        setActiveAttendeeId,
        addAttendee,
        updateAttendee,
        deleteAttendee,
        setActiveTab,
        setSelectedProjectId,
        setActiveApprovalTask,
        setActiveExecutionResult,
        setEventBrief,
        updateEventBrief,
        setConversationMessages,
        addConversationMessage,
        setConversationPhase,
        launchEventFromBrief,
        updateAgent,
        createAgent,
        createProject,
        updateProject,
        createTask,
        updateTask,
        updateTaskStatus,
        approveTask,
        rejectTask,
        addActivityLog,
        executeWorkflowPlan,
        triggerBolnaCall,
        saveBolnaSettings,
        saveSupabaseSettings,
        resetToDefaultData,
      }}
    >
      {children}
    </EchoFrameContext.Provider>
  );
}

export function useEchoFrame() {
  const context = useContext(EchoFrameContext);
  if (!context) {
    throw new Error('useEchoFrame must be used within an EchoFrameProvider');
  }
  return context;
}
