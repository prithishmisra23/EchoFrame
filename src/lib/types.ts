export type DomainType = 'event' | 'podcast' | 'shared';

export type EchoFrameTab = 'operator' | 'dashboard' | 'agents' | 'command' | 'operations' | 'projects' | 'stage-host' | 'attendees' | 'settings';

export type AgentRole = 
  // Event Agents
  | 'speaker_coordination'
  | 'attendee_support'
  | 'registrations_ticketing'
  | 'scheduling_agenda'
  | 'stage_hosting_mc'
  | 'post_event_feedback'
  // Podcast Agents
  | 'guest_coordination'
  | 'research_briefing'
  | 'interviewing_cohost'
  | 'episode_production'
  | 'content_distribution'
  // Custom
  | 'custom';

export type AgentStatus = 'active' | 'idle' | 'in_call' | 'processing' | 'paused';

export type AutonomyLevel = 'full_autonomous' | 'require_approval' | 'read_only';

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  requiresApproval: boolean;
  category: 'voice' | 'email' | 'calendar' | 'research' | 'publishing' | 'system';
}

export interface AgentKnowledgeDoc {
  id: string;
  title: string;
  size: string;
  type: 'pdf' | 'doc' | 'link' | 'faq';
  lastUpdated: string;
  contentSnippet?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  domain: DomainType;
  title: string;
  avatar: string;
  status: AgentStatus;
  autonomyLevel: AutonomyLevel;
  voiceConfig: {
    provider: 'bolna' | 'elevenlabs' | 'deepgram' | 'openai';
    voiceId: string;
    voiceName: string;
    pitch: number;
    speed: number;
    temperature: number;
  };
  systemPrompt: string;
  tools: AgentTool[];
  knowledgeDocs: AgentKnowledgeDoc[];
  bolnaAgentId?: string;
  bolnaSynced: boolean;
  totalCallsCompleted: number;
  totalTasksResolved: number;
  assignedProjectIds: string[];
}

export type ProjectType = 'event' | 'podcast';

export interface EventSpeaker {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  sessionTitle: string;
  timeSlot: string;
  stage: string;
  status: 'confirmed' | 'pending_call' | 'call_scheduled' | 'declined';
  lastAgentContact?: string;
}

export interface EventAttendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'hacker' | 'mentor' | 'judge' | 'vip' | 'organizer' | 'attendee';
  track?: string;
  teamName?: string;
  ticketTier?: string;
  badgeCode: string;
  languagePref?: 'en' | 'hi' | 'ta';
  checkInStatus: 'checked_in' | 'registered' | 'pending';
  lastAiInteraction?: string;
}

export interface EventVenueZone {
  name: string;
  description: string;
  stage?: string;
}

export interface EventVenueDetails {
  venueName: string;
  address: string;
  wifiSsid: string;
  wifiPassword?: string;
  emergencyContact?: string;
  zones?: EventVenueZone[];
}

export interface EventFaq {
  question: string;
  answer: string;
  category: 'schedule' | 'wifi' | 'venue' | 'rules' | 'mentors' | 'food';
}

export interface PodcastGuest {
  id: string;
  name: string;
  role: string;
  topic: string;
  episodeNumber: number;
  email: string;
  phone: string;
  status: 'booked' | 'briefing_ready' | 'recording_scheduled' | 'post_production';
  recordingDate: string;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  speaker: string;
  stage: string;
  status: 'upcoming' | 'live' | 'completed' | 'delayed';
  durationMinutes: number;
}

export interface Project {
  id: string;
  type: ProjectType;
  title: string;
  description: string;
  date: string;
  locationOrPlatform: string;
  status: 'planning' | 'active' | 'in_progress' | 'completed';
  assignedAgentIds: string[];
  metrics: {
    progressPercent: number;
    tasksTotal: number;
    tasksCompleted: number;
    speakersOrGuestsCount: number;
    registeredAttendeesCount?: number;
    callsMadeCount: number;
  };
  speakers?: EventSpeaker[];
  attendees?: EventAttendee[];
  guests?: PodcastGuest[];
  agenda?: AgendaItem[];
  venueDetails?: EventVenueDetails;
  faqs?: EventFaq[];
  tags: string[];
}

export type TaskStatus = 'backlog' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskActionPayload {
  actionType: 'voice_call' | 'email_outreach' | 'calendar_shift' | 'publish_content' | 'database_update';
  recipient?: string;
  phone?: string;
  subject?: string;
  messageContent?: string;
  proposedChanges?: Record<string, any>;
  bolnaAgentId?: string;
}

export type TaskLifecycleState = 'planned' | 'awaiting_approval' | 'queued' | 'executing' | 'succeeded' | 'failed';

export interface Task {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  description: string;
  assignedAgentId: string;
  status: TaskStatus;
  lifecycleState?: TaskLifecycleState;
  dependsOn?: string[];
  priority: TaskPriority;
  createdAt: string;
  completedAt?: string;
  actionPayload?: TaskActionPayload;
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  provider?: string;
  result?: any;
  error?: string;
  executionLog: {
    timestamp: string;
    message: string;
    level: 'info' | 'action' | 'warning' | 'success';
  }[];
  bolnaExecutionId?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  domain: DomainType;
  projectId?: string;
  projectTitle?: string;
  type: 'call_completed' | 'call_started' | 'task_created' | 'approval_requested' | 'approval_granted' | 'alert' | 'agent_sync';
  message: string;
  details?: string;
}

export interface BolnaCallPayload {
  agent_id: string;
  recipient_phone_number: string;
  recipient_name?: string;
  context_data?: Record<string, any>;
}

export interface BolnaExecutionResult {
  execution_id: string;
  agent_id: string;
  status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
  call_duration_seconds: number;
  transcript: {
    speaker: 'agent' | 'user';
    text: string;
    timestamp: string;
  }[];
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'skeptical' | 'enthusiastic';
  created_at: string;
  is_sandbox?: boolean;
  provider?: string;
  error?: string;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  title: string;
  description: string;
  actionType: 'voice_call' | 'research' | 'schedule' | 'email' | 'analysis';
  requiresHumanApproval: boolean;
  dependsOn?: string[];
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed';
}

export interface WorkflowPlan {
  id: string;
  userPrompt: string;
  projectId: string;
  projectTitle: string;
  domain: DomainType;
  summary: string;
  steps: WorkflowStep[];
  status: 'draft' | 'executing' | 'completed';
}

// --- Event Operator Conversation Types ---

export interface EventBrief {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  goals?: string;
  date?: string;
  timezone?: string;
  venue?: string;
  venueConfirmed?: boolean;
  expectedAttendance?: number;
  budget?: string;
  audience?: string;
  speakers?: string;
  sponsors?: string;
  registrationNeeds?: string;
  scheduleNeeds?: string;
  languages?: string[];
  constraints?: string;
  status: 'draft' | 'clarifying' | 'confirmed' | 'planning' | 'active';
  createdAt: string;
  updatedAt: string;
}

export interface AgentAssignment {
  agentId: string;
  agentName: string;
  role: string;
  reason: string;
}

export interface OrchestratorResponse {
  message: string;
  briefUpdates?: Partial<EventBrief>;
  questions?: string[];
  readyForPlanning: boolean;
  agentSuggestions?: AgentAssignment[];
  proposedTasks?: {
    title: string;
    description: string;
    agentRole: string;
    actionType: string;
    requiresApproval: boolean;
    dependsOn?: string[];
  }[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  briefUpdates?: Partial<EventBrief>;
  agentSuggestions?: AgentAssignment[];
  proposedTasks?: OrchestratorResponse['proposedTasks'];
  readyForPlanning?: boolean;
}

export type ConversationPhase =
  | 'initial'
  | 'understanding'
  | 'clarifying'
  | 'briefReady'
  | 'planning'
  | 'executing'
  | 'completed'
  | 'blocked';
