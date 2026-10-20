'use client';

import React, { useState } from 'react';
import { Project, EventSpeaker, PodcastGuest, AgendaItem } from '@/lib/types';
import { useEchoFrame } from '@/lib/store';
import { 
  X, 
  Calendar, 
  Headphones, 
  PhoneCall, 
  Clock, 
  Users, 
  Sparkles, 
  PhoneForwarded, 
  Mic 
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onOpenVoiceCampaign: (project: Project) => void;
  onTestVoiceAgent: (agentId: string) => void;
}

export function ProjectDetailModal({ project, onClose, onOpenVoiceCampaign, onTestVoiceAgent }: ProjectDetailModalProps) {
  const { agents, createTask, setActiveApprovalTask, setSelectedProjectId, setActiveTab } = useEchoFrame();

  const isEvent = project.type === 'event';
  const [activeTab, setActiveTabLocal] = useState<'roster' | 'agenda' | 'team'>('roster');
  const [callingContactId, setCallingContactId] = useState<string | null>(null);

  const assignedAgents = agents.filter((a) => project.assignedAgentIds.includes(a.id));

  const handleCallContact = (contact: EventSpeaker | PodcastGuest) => {
    const agent = assignedAgents.find((a) => a.role.includes(isEvent ? 'speaker' : 'guest')) || assignedAgents[0] || agents[0];

    const task = createTask({
      projectId: project.id,
      projectTitle: project.title,
      assignedAgentId: agent.id,
      title: `Speaker Verification Call: ${contact.name}`,
      description: `Outbound coordination and rider verification with ${contact.name}.`,
      priority: 'high',
      status: 'awaiting_approval',
      requiresApproval: true,
      actionPayload: {
        actionType: 'voice_call',
        recipient: contact.name,
        phone: contact.phone,
        messageContent: `Hello ${contact.name}, this is ${agent.name} calling on behalf of ${project.title}. Confirming your technical setup and stage schedule.`,
        bolnaAgentId: agent.bolnaAgentId || 'yellow-thomas-5037',
      },
    });

    onClose();
    setActiveTab('operations');
    setActiveApprovalTask(task);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'var(--bg-surface-1)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1"
          title="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div
          className="p-6"
          style={{
            background: 'var(--bg-surface-2)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="badge"
              style={{
                fontSize: '10px',
                background: isEvent ? 'var(--accent-subtle)' : 'rgba(168, 85, 247, 0.1)',
                borderColor: isEvent ? 'var(--accent-border)' : 'rgba(168, 85, 247, 0.25)',
                color: isEvent ? 'var(--accent)' : '#d8b4fe',
              }}
            >
              {isEvent ? <Calendar className="h-3 w-3 mr-1 inline" /> : <Headphones className="h-3 w-3 mr-1 inline" />}
              {isEvent ? 'Event Operation' : 'Podcast Production'}
            </span>
            <span className="text-caption font-mono text-zinc-400">• {project.date}</span>
          </div>

          <h2 className="text-subheading" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {project.title}
          </h2>
          <p className="mt-1 text-caption max-w-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {project.description}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div
              className="rounded-lg p-2"
              style={{
                background: 'var(--bg-surface-0)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Completion</div>
              <div className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>{project.metrics.progressPercent}%</div>
            </div>
            <div
              className="rounded-lg p-2"
              style={{
                background: 'var(--bg-surface-0)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Tasks Handled</div>
              <div className="font-semibold text-white mt-0.5">{project.metrics.tasksCompleted}/{project.metrics.tasksTotal}</div>
            </div>
            <div
              className="rounded-lg p-2"
              style={{
                background: 'var(--bg-surface-0)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{isEvent ? 'Attendees' : 'Episodes'}</div>
              <div className="font-semibold text-white mt-0.5">
                {isEvent ? (project.metrics.registeredAttendeesCount || 1200).toLocaleString() : '8 Episodes'}
              </div>
            </div>
            <div
              className="rounded-lg p-2"
              style={{
                background: 'var(--bg-surface-0)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Voice Calls</div>
              <div className="font-semibold mt-0.5" style={{ color: 'var(--accent)' }}>{project.metrics.callsMadeCount}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex px-6 gap-2 text-xs"
          style={{
            background: 'var(--bg-surface-0)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setActiveTabLocal('roster')}
            className="py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5"
            style={{
              borderColor: activeTab === 'roster' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'roster' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{isEvent ? `Keynote Speakers (${project.speakers?.length || 0})` : `Podcast Guests (${project.guests?.length || 0})`}</span>
          </button>

          {isEvent && (
            <button
              onClick={() => setActiveTabLocal('agenda')}
              className="py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5"
              style={{
                borderColor: activeTab === 'agenda' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'agenda' ? 'var(--accent)' : 'var(--text-tertiary)',
              }}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Run-of-Show Agenda ({project.agenda?.length || 0})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTabLocal('team')}
            className="py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5"
            style={{
              borderColor: activeTab === 'team' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'team' ? 'var(--accent)' : 'var(--text-tertiary)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Assigned Agent Team ({assignedAgents.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tab 1: Speakers or Guests Roster */}
          {activeTab === 'roster' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                  {isEvent ? 'Speaker Confirmation & Rider Directory' : 'Talent Guest Roster'}
                </span>

                <button
                  onClick={() => onOpenVoiceCampaign(project)}
                  className="btn-secondary flex items-center gap-1.5 text-xs"
                  style={{ padding: '5px 12px' }}
                >
                  <PhoneForwarded className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Launch Voice Campaign</span>
                </button>
              </div>

              <div
                className="divide-y rounded-lg overflow-hidden"
                style={{
                  background: 'var(--bg-surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {isEvent ? (
                  project.speakers?.map((spk) => (
                    <div key={spk.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-white">{spk.name}</h4>
                          <span
                            className={`badge ${spk.status === 'confirmed' ? 'badge-accent' : 'badge-warning'}`}
                            style={{ fontSize: '9px' }}
                          >
                            {spk.status === 'confirmed' ? 'Confirmed' : 'Pending Verification'}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {spk.title} • {spk.company}
                        </p>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          Session: <span className="text-zinc-200 font-medium">&ldquo;{spk.sessionTitle}&rdquo;</span>
                        </p>
                        {spk.lastAgentContact && (
                          <div className="mt-1 text-[10px] font-mono" style={{ color: 'var(--accent)' }}>
                            ⚡ {spk.lastAgentContact}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleCallContact(spk)}
                        disabled={callingContactId === spk.id}
                        className="btn-secondary self-start sm:self-auto flex items-center gap-1.5"
                        style={{ padding: '5px 12px', fontSize: '11px' }}
                      >
                        <PhoneCall className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                        <span>{callingContactId === spk.id ? 'Connecting…' : 'Dial via Bolna'}</span>
                      </button>
                    </div>
                  ))
                ) : (
                  project.guests?.map((gst) => (
                    <div key={gst.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-white">{gst.name}</h4>
                          <span
                            className="badge"
                            style={{
                              fontSize: '9px',
                              background: 'rgba(168, 85, 247, 0.1)',
                              borderColor: 'rgba(168, 85, 247, 0.25)',
                              color: '#d8b4fe',
                            }}
                          >
                            Episode {gst.episodeNumber}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{gst.role}</p>
                        <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                          Topic: <span className="text-white font-medium">{gst.topic}</span>
                        </p>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Recording: {gst.recordingDate}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCallContact(gst)}
                        disabled={callingContactId === gst.id}
                        className="btn-secondary self-start sm:self-auto flex items-center gap-1.5"
                        style={{ padding: '5px 12px', fontSize: '11px' }}
                      >
                        <PhoneCall className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                        <span>{callingContactId === gst.id ? 'Connecting…' : 'Soundcheck Call'}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Agenda Run of Show */}
          {activeTab === 'agenda' && isEvent && (
            <div className="space-y-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Auditorium Schedule & Run-of-Show
              </div>

              <div
                className="divide-y rounded-lg overflow-hidden"
                style={{
                  background: 'var(--bg-surface-0)',
                  border: '1px solid var(--border-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {project.agenda?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs font-semibold w-16 flex-shrink-0" style={{ color: 'var(--accent)' }}>
                        {item.time}
                      </div>

                      <div>
                        <h4 className="text-xs font-medium text-white">{item.title}</h4>
                        <p className="text-caption mt-0.5">
                          {item.speaker} • <span style={{ color: 'var(--text-tertiary)' }}>{item.stage}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`badge ${
                        item.status === 'live'
                          ? 'badge-danger'
                          : item.status === 'completed'
                          ? 'badge-neutral'
                          : 'badge-accent'
                      }`}
                      style={{ fontSize: '9px' }}
                    >
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Assigned Agents Team */}
          {activeTab === 'team' && (
            <div className="space-y-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Assigned Team of Specialized AI Agents
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assignedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-3 rounded-lg flex items-center justify-between gap-3"
                    style={{
                      background: 'var(--bg-surface-0)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{agent.avatar}</span>
                      <div>
                        <div className="text-xs font-medium text-white">{agent.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{agent.title}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => onTestVoiceAgent(agent.id)}
                      className="btn-secondary p-1.5"
                      title="Test Voice Persona"
                    >
                      <Mic className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between px-6 py-3.5"
          style={{
            background: 'var(--bg-surface-2)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => {
              setSelectedProjectId(project.id);
              setActiveTab('operations');
              onClose();
            }}
            className="text-caption hover:underline font-medium"
            style={{ color: 'var(--accent)' }}
          >
            Filter Live Operations for this project →
          </button>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '11px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
