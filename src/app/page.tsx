'use client';

import React, { useState } from 'react';
import { useEchoFrame } from '@/lib/store';
import { Project, EchoFrameTab } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCards } from '@/components/dashboard/StatCards';
import { ProjectsOverview } from '@/components/dashboard/ProjectsOverview';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { AgentStudio } from '@/components/agents/AgentStudio';
import { VoiceCommandCenter } from '@/components/voice-command/VoiceCommandCenter';
import { LiveOperations } from '@/components/operations/LiveOperations';
import { ProjectDetailModal } from '@/components/projects/ProjectDetailModal';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { VoiceCampaignModal } from '@/components/projects/VoiceCampaignModal';
import { IntegrationsModal } from '@/components/settings/IntegrationsModal';
import { VoicePreviewModal } from '@/components/agents/VoicePreviewModal';
import { StageHostExperience } from '@/components/stage-host/StageHostExperience';
import { AttendeePersonalAiExperience } from '@/components/attendees/AttendeePersonalAiExperience';
import { EventOperator } from '@/components/operator/EventOperator';
import { 
  Mic2, 
  ArrowRight, 
  Radio, 
} from 'lucide-react';

export default function Home() {
  const { activeTab, setActiveTab, agents, conversationMessages } = useEchoFrame();

  const isInitialHome = activeTab === 'operator' && conversationMessages.length === 0;
  // User toggle overrides initial home layout; otherwise defaults to hidden on initial home and open once active
  const [sidebarManuallyToggled, setSidebarManuallyToggled] = useState<boolean | null>(null);
  const showSidebar = sidebarManuallyToggled !== null ? sidebarManuallyToggled : !isInitialHome;

  const [activeProjectDetail, setActiveProjectDetail] = useState<Project | null>(null);
  const [activeVoiceCampaignProject, setActiveVoiceCampaignProject] = useState<Project | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [previewAgentId, setPreviewAgentId] = useState<string | null>(null);

  const previewingAgent = previewAgentId ? agents.find((a) => a.id === previewAgentId) : null;

  const tabLabels: { id: EchoFrameTab; label: string }[] = [
    { id: 'operator', label: 'Operator' },
    { id: 'operations', label: 'Ops' },
    { id: 'stage-host', label: 'Stage Host' },
    { id: 'attendees', label: 'Personal AI' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'agents', label: 'Agents' },
    { id: 'command', label: 'Voice' },
    { id: 'projects', label: 'Projects' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dots-pattern" style={{ background: 'var(--bg-app)' }}>
      <Header
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenCreateProject={() => setShowCreateProjectModal(true)}
        isInitialHome={isInitialHome}
        showSidebar={showSidebar}
        onToggleSidebar={() => setSidebarManuallyToggled((prev) => (prev !== null ? !prev : isInitialHome))}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={showSidebar} onClose={() => setSidebarManuallyToggled(false)} />

        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isInitialHome && !showSidebar ? 'p-3 sm:p-6 lg:p-10 flex flex-col justify-center' : 'p-5 sm:p-6 lg:p-8 space-y-6'}`}>
          {/* Mobile Tab Bar (visible when workspace is open or outside initial home) */}
          {(!isInitialHome || showSidebar) && (
            <div className="flex md:hidden overflow-x-auto pb-1 gap-1.5 mb-4">
              {tabLabels.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-default"
                  style={{
                    background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-surface-2)',
                    color: activeTab === tab.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    border: `1px solid ${activeTab === tab.id ? 'var(--accent)' : 'var(--border-default)'}`,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* EVENT OPERATOR (Primary Experience) */}
          {activeTab === 'operator' && (
            <EventOperator onStartConversation={() => setSidebarManuallyToggled(true)} />
          )}

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Command Banner */}
              <div
                className="relative rounded-xl p-5 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--bg-surface-1) 0%, var(--bg-surface-2) 100%)',
                  border: '1px solid var(--accent-border)',
                }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5"
                  style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
                />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="status-dot status-dot-live" />
                      <span className="text-label" style={{ color: 'var(--accent)' }}>
                        Voice AI Command Center
                      </span>
                    </div>
                    <h2 className="text-heading" style={{ fontSize: '1rem' }}>
                      Orchestrate your agents with natural voice commands
                    </h2>
                    <p className="text-caption mt-1 max-w-lg">
                      Speak instructions to trigger speaker confirmations, schedule adjustments, or podcast production tasks via Bolna telephony.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('command')}
                    className="btn-primary self-start sm:self-auto"
                    style={{ padding: '10px 20px' }}
                  >
                    <Mic2 className="h-3.5 w-3.5" />
                    <span>Launch Voice</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <StatCards />

              <ProjectsOverview
                onSelectProject={(project) => setActiveProjectDetail(project)}
                onOpenCreateModal={() => setShowCreateProjectModal(true)}
                onOpenVoiceCampaign={(project) => setActiveVoiceCampaignProject(project)}
              />

              <RecentActivityFeed />
            </div>
          )}

          {/* AGENT STUDIO */}
          {activeTab === 'agents' && <AgentStudio />}

          {/* VOICE COMMAND */}
          {activeTab === 'command' && <VoiceCommandCenter />}

          {/* OPERATIONS */}
          {activeTab === 'operations' && <LiveOperations />}

          {/* PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <ProjectsOverview
                onSelectProject={(project) => setActiveProjectDetail(project)}
                onOpenCreateModal={() => setShowCreateProjectModal(true)}
                onOpenVoiceCampaign={(project) => setActiveVoiceCampaignProject(project)}
              />
            </div>
          )}

          {/* STAGE HOST EXPERIENCE */}
          {activeTab === 'stage-host' && <StageHostExperience />}

          {/* ATTENDEE PERSONAL AI & ROSTER */}
          {activeTab === 'attendees' && <AttendeePersonalAiExperience />}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto py-4">
              <div className="surface-card p-6 space-y-4">
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                    <h2 className="text-subheading">Integration Hub</h2>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="btn-primary"
                  >
                    Configure
                  </button>
                </div>
                <p className="text-body">
                  EchoFrame integrates with Bolna for low-latency conversational telephony and Supabase for cloud database synchronization.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-lg p-4"
                    style={{ background: 'var(--bg-surface-0)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="text-subheading mb-1" style={{ fontSize: '0.75rem' }}>Bolna Voice AI</div>
                    <p className="text-caption">
                      Outbound telephony, speech recognition, and low-latency voice synthesis.
                    </p>
                  </div>
                  <div
                    className="rounded-lg p-4"
                    style={{ background: 'var(--bg-surface-0)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="text-subheading mb-1" style={{ fontSize: '0.75rem' }}>Supabase Postgres</div>
                    <p className="text-caption">
                      Persistent storage for agents, tasks, and execution telemetry with RLS.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      {activeProjectDetail && (
        <ProjectDetailModal
          project={activeProjectDetail}
          onClose={() => setActiveProjectDetail(null)}
          onOpenVoiceCampaign={(p) => setActiveVoiceCampaignProject(p)}
          onTestVoiceAgent={(agentId) => setPreviewAgentId(agentId)}
        />
      )}

      {activeVoiceCampaignProject && (
        <VoiceCampaignModal
          project={activeVoiceCampaignProject}
          onClose={() => setActiveVoiceCampaignProject(null)}
        />
      )}

      {showCreateProjectModal && (
        <CreateProjectModal
          onClose={() => setShowCreateProjectModal(false)}
        />
      )}

      {showSettingsModal && (
        <IntegrationsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {previewingAgent && (
        <VoicePreviewModal
          agent={previewingAgent}
          onClose={() => setPreviewAgentId(null)}
        />
      )}
    </div>
  );
}
